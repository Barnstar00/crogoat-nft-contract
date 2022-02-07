pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IDividendDistributor {
    function setDistributionCriteria(
        uint256 _minPeriod,
        uint256 _minDistribution
    ) external;

    function setShare(address shareholder, uint256 amount) external;

    function deposit() external payable;

    function process(uint256 gas) external;

    function claimDividend() external;
}

contract DividendDistributor is IDividendDistributor {
    using SafeMath for uint256;

    address _staker;

    struct Share {
        uint256 amount;
        uint256 totalExcluded;
        uint256 totalRealised;
    }

    address[] shareholders;

    mapping(address => uint256) shareholderIndexes;
    mapping(address => uint256) shareholderClaims;

    mapping(address => Share) public shares;

    uint256 public totalShares;
    uint256 public totalDividends;
    uint256 public totalDistributed;
    uint256 public dividendsPerShare;
    uint256 public dividendsPerShareAccuracyFactor = 10**36;

    uint256 public minPeriod = 2 hours; // min 2 hours delay
    uint256 public minDistribution = (3 / 10) * (10**18); //

    uint256 currentIndex;

    modifier onlyStaker() {
        require(msg.sender == _staker);
        _;
    }

    constructor() {
        _staker = msg.sender;
    }

    function setDistributionCriteria(
        uint256 _minPeriod,
        uint256 _minDistribution
    ) external override onlyStaker {
        minPeriod = _minPeriod;
        minDistribution = _minDistribution;
    }

    function setShare(address shareholder, uint256 amount)
        external
        override
        onlyStaker
    {
        if (shares[shareholder].amount > 0) {
            distributeDividend(shareholder);
        }

        if (amount > 0 && shares[shareholder].amount == 0) {
            addShareholder(shareholder);
        } else if (amount == 0 && shares[shareholder].amount > 0) {
            removeShareholder(shareholder);
        }

        totalShares = totalShares.sub(shares[shareholder].amount).add(amount);
        shares[shareholder].amount = amount;
        shares[shareholder].totalExcluded = getCumulativeDividends(
            shares[shareholder].amount
        );
    }

    function deposit() external payable override onlyStaker {
        uint256 amount = msg.value;

        totalDividends = totalDividends.add(amount);

        dividendsPerShare = dividendsPerShare.add(
            dividendsPerShareAccuracyFactor.mul(amount).div(totalShares)
        );
    }

    function process(uint256 gas) external override onlyStaker {
        uint256 shareholderCount = shareholders.length;

        if (shareholderCount == 0) {
            return;
        }

        uint256 gasUsed = 0;
        uint256 gasLeft = gasleft();

        uint256 iterations = 0;

        while (gasUsed < gas && iterations < shareholderCount) {
            if (currentIndex >= shareholderCount) {
                currentIndex = 0;
            }

            if (shouldDistribute(shareholders[currentIndex])) {
                distributeDividend(shareholders[currentIndex]);
            }

            gasUsed = gasUsed.add(gasLeft.sub(gasleft()));
            gasLeft = gasleft();
            currentIndex++;
            iterations++;
        }
    }

    function shouldDistribute(address shareholder)
        internal
        view
        returns (bool)
    {
        return
            shareholderClaims[shareholder] + minPeriod < block.timestamp &&
            getUnpaidEarnings(shareholder) > minDistribution;
    }

    function distributeDividend(address shareholder) internal {
        if (shares[shareholder].amount == 0) {
            return;
        }

        uint256 amount = getUnpaidEarnings(shareholder);
        if (amount > 0) {
            totalDistributed = totalDistributed.add(amount);
            (bool res, ) = shareholder.call{value: amount}("");
            require(res, "ETH TRANSFER FAILED");

            shareholderClaims[shareholder] = block.timestamp;
            shares[shareholder].totalRealised = shares[shareholder]
                .totalRealised
                .add(amount);
            shares[shareholder].totalExcluded = getCumulativeDividends(
                shares[shareholder].amount
            );
        }
    }

    function claimDividend() external override {
        distributeDividend(msg.sender);
    }

    function getUnpaidEarnings(address shareholder)
        public
        view
        returns (uint256)
    {
        if (shares[shareholder].amount == 0) {
            return 0;
        }

        uint256 shareholderTotalDividends = getCumulativeDividends(
            shares[shareholder].amount
        );
        uint256 shareholderTotalExcluded = shares[shareholder].totalExcluded;

        if (shareholderTotalDividends <= shareholderTotalExcluded) {
            return 0;
        }

        return shareholderTotalDividends.sub(shareholderTotalExcluded);
    }

    function getCumulativeDividends(uint256 share)
        internal
        view
        returns (uint256)
    {
        return
            share.mul(dividendsPerShare).div(dividendsPerShareAccuracyFactor);
    }

    function addShareholder(address shareholder) internal {
        shareholderIndexes[shareholder] = shareholders.length;
        shareholders.push(shareholder);
    }

    function removeShareholder(address shareholder) internal {
        shareholders[shareholderIndexes[shareholder]] = shareholders[
            shareholders.length - 1
        ];
        shareholderIndexes[
            shareholders[shareholders.length - 1]
        ] = shareholderIndexes[shareholder];
        shareholders.pop();
    }
}

contract GoatStaking is ReentrancyGuard, Pausable, Ownable, IERC721Receiver {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.UintSet;
    using SafeERC20 for IERC20;

    DividendDistributor public distributor;
    uint256 distributorGas = 500000;

    address public stakeNft;
    uint256 public maxStakeLimit = 20;

    receive() external payable {}

    mapping(address => EnumerableSet.UintSet) private userBlanaces;

    event Staked(address indexed account, uint256 tokenId);
    event BatchStaked(address indexed account, uint256[] tokenIds);

    event Withdrawn(address indexed account, uint256 tokenId);

    event BatchWithdrawn(address indexed account, uint256[] tokenIds);

    constructor(address _stakeNft) {
        stakeNft = _stakeNft;
        distributor = new DividendDistributor();
    }

    function userStakedNFT(address _owner)
        public
        view
        returns (uint256[] memory)
    {
        //  return userBlanaces[_owner].values();
        uint256 tokenCount = userBlanaces[_owner].length();
        if (tokenCount == 0) {
            // Return an empty array
            return new uint256[](0);
        } else {
            uint256[] memory result = new uint256[](tokenCount);
            uint256 index;
            for (index = 0; index < tokenCount; index++) {
                result[index] = tokenOfOwnerByIndex(_owner, index);
            }
            return result;
        }
    }

    function tokenOfOwnerByIndex(address owner, uint256 index)
        public
        view
        returns (uint256)
    {
        return userBlanaces[owner].at(index);
    }

    function userStakedNFTCount(address _owner) public view returns (uint256) {
        return userBlanaces[_owner].length();
    }

    function isStaked(address account, uint256 tokenId)
        public
        view
        returns (bool)
    {
        return userBlanaces[account].contains(tokenId);
    }

    function depositReward() public payable {
        require(msg.value > 0, "Insufficient balance");

        try distributor.deposit{value: msg.value}() {} catch {}

        try distributor.process(distributorGas) {} catch {}
    }

    function stake(uint256 tokenId) public nonReentrant whenNotPaused {
        require(
            IERC721(stakeNft).isApprovedForAll(_msgSender(), address(this)),
            "Not approve nft to staker address"
        );

        IERC721(stakeNft).safeTransferFrom(
            _msgSender(),
            address(this),
            tokenId
        );

        userBlanaces[_msgSender()].add(tokenId);

        uint256 mybalance = userBlanaces[_msgSender()].length();

        try distributor.setShare(_msgSender(), mybalance) {} catch {}

        emit Staked(_msgSender(), tokenId);
    }

    function batchStake(uint256[] calldata _tokenIds)
        public
        nonReentrant
        whenNotPaused
    {
        require(
            IERC721(stakeNft).isApprovedForAll(_msgSender(), address(this)),
            "Not approve nft to staker address"
        );

        require(maxStakeLimit >= _tokenIds.length, "Max limit to stake");

        for (uint256 i = 0; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            IERC721(stakeNft).safeTransferFrom(
                _msgSender(),
                address(this),
                tokenId
            );
            userBlanaces[_msgSender()].add(tokenId);
        }

        uint256 mybalance = userBlanaces[_msgSender()].length();

        try distributor.setShare(_msgSender(), mybalance) {} catch {}

        emit BatchStaked(_msgSender(), _tokenIds);
    }

    function unstake(uint256 tokenId) public nonReentrant {
        require(tokenId > 0, "Invaild token id");

        require(isStaked(_msgSender(), tokenId), "Not staked this nft");

        IERC721(stakeNft).safeTransferFrom(
            address(this),
            _msgSender(),
            tokenId
        );

        userBlanaces[_msgSender()].remove(tokenId);

        uint256 mybalance = userBlanaces[_msgSender()].length();

        try distributor.setShare(_msgSender(), mybalance) {} catch {}

        emit Withdrawn(_msgSender(), tokenId);
    }

    function batchUnStake(uint256[] calldata _tokenIds) external nonReentrant {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];

            require(isStaked(_msgSender(), tokenId), "Not staked this nft");

            IERC721(stakeNft).safeTransferFrom(
                address(this),
                _msgSender(),
                tokenId
            );
            userBlanaces[_msgSender()].remove(tokenId);
        }

        uint256 mybalance = userBlanaces[_msgSender()].length();

        try distributor.setShare(_msgSender(), mybalance) {} catch {}

        emit BatchWithdrawn(_msgSender(), _tokenIds);
    }

    function distributeReward() external {
        try distributor.process(distributorGas) {} catch {}
    }

    function withdrawCollectedETH(address recipient, uint256 amount)
        public
        onlyOwner
    {
        require(address(this).balance > 0, "Insufficient balance");
        (bool res, ) = recipient.call{value: amount}("");
        require(res, "ETH TRANSFER FAILED");
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function setIsDividendExempt(address holder, bool exempt)
        external
        onlyOwner
    {
        require(holder != address(this));
        if (exempt) {
            distributor.setShare(holder, 0);
        } else {
            uint256 holderbalance = userBlanaces[holder].length();
            distributor.setShare(holder, holderbalance);
        }
    }

    function setDistributionCriteria(
        uint256 _minPeriod,
        uint256 _minDistribution
    ) external onlyOwner {
        distributor.setDistributionCriteria(_minPeriod, _minDistribution);
    }

    function setDistributorSettings(uint256 gas) external onlyOwner {
        require(gas <= 1000000);
        distributorGas = gas;
    }

    function setStakeLimit(uint256 _limit) external onlyOwner {
        maxStakeLimit = _limit;
    }

    function claimDividend() external {
        distributor.claimDividend();
    }
}
