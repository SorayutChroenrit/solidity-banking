let web3;
let bankContract;
let userAccount;
let isConnected = false;

const abi = [
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [],
    name: "checkBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const ContractAddress = "0x1A9d66Ff16B238A35AE27F652d43b179926cdA0c";

// DOM Elements
const connectWalletBtn = document.getElementById("connectWalletBtn");
const walletButtonText = document.getElementById("walletButtonText");
const userAddress = document.getElementById("userAddress");
const balanceAmount = document.getElementById("balanceAmount");
const depositForm = document.getElementById("depositForm");
const withdrawForm = document.getElementById("withdrawForm");
const depositAmount = document.getElementById("depositAmount");
const withdrawAmount = document.getElementById("withdrawAmount");
const depositLoading = document.getElementById("depositLoading");
const withdrawLoading = document.getElementById("withdrawLoading");
const historyLoading = document.getElementById("historyLoading");
const depositAlert = document.getElementById("depositAlert");
const withdrawAlert = document.getElementById("withdrawAlert");
const transactionHistory = document.getElementById("transactionHistory");
const walletModal = document.getElementById("walletModal");
const closeModal = document.getElementById("closeModal");
const metamaskOption = document.getElementById("metamaskOption");
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

// Initialize app
async function init() {
  // Check if MetaMask is installed
  if (typeof window.ethereum !== "undefined") {
    console.log("MetaMask is installed!");
    setupEventListeners();
  } else {
    console.log("MetaMask is not installed");
    showAlert(
      depositAlert,
      "MetaMask is not installed. Please install MetaMask to use this App.",
      "error"
    );
  }
}

// Set up event listeners
function setupEventListeners() {
  connectWalletBtn.addEventListener("click", openConnectModal);
  closeModal.addEventListener("click", closeConnectModal);
  metamaskOption.addEventListener("click", connectWallet);
  depositForm.addEventListener("submit", handleDeposit);
  withdrawForm.addEventListener("submit", handleWithdraw);

  // Tab switching
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.getAttribute("data-tab");
      setActiveTab(tabId);
    });
  });

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === walletModal) {
      closeConnectModal();
    }
  });
}

// Open connect wallet modal
function openConnectModal() {
  walletModal.style.display = "flex";
}

// Close connect wallet modal
function closeConnectModal() {
  walletModal.style.display = "none";
}

// Connect wallet function
async function connectWallet() {
  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    userAccount = accounts[0];

    // Initialize Web3
    web3 = new Web3(window.ethereum);

    // Initialize contract
    bankContract = new web3.eth.Contract(abi, ContractAddress);

    // Update UI
    updateUI();

    // Set up event listeners for accounts changed
    window.ethereum.on("accountsChanged", (accounts) => {
      userAccount = accounts[0];
      updateUI();
    });

    // Set up event listeners for chain changed
    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });

    isConnected = true;
    closeConnectModal();
    fetchTransactionHistory();
  } catch (error) {
    console.error("Error connecting wallet:", error);
    showAlert(
      depositAlert,
      "Failed to connect wallet. " + error.message,
      "error"
    );
  }
}

// Update UI when wallet is connected
async function updateUI() {
  if (userAccount) {
    // Update wallet button
    walletButtonText.textContent =
      userAccount.slice(0, 6) + "..." + userAccount.slice(-4);

    // Update user address
    userAddress.textContent = userAccount;

    // Update balance
    await updateBalance();
  }
}

// Update balance
async function updateBalance() {
  try {
    const balance = await bankContract.methods
      .checkBalance()
      .call({ from: userAccount });
    balanceAmount.textContent = web3.utils.fromWei(balance, "ether") + " ETH";
  } catch (error) {
    console.error("Error fetching balance:", error);
    balanceAmount.textContent = "0.00 ETH";
  }
}

// Handle deposit
async function handleDeposit(event) {
  event.preventDefault();

  if (!isConnected) {
    showAlert(depositAlert, "Please connect your wallet first", "error");
    return;
  }

  const amount = depositAmount.value;

  if (amount <= 0) {
    showAlert(depositAlert, "Please enter a valid amount", "error");
    return;
  }

  try {
    depositLoading.style.display = "flex";
    depositAlert.innerHTML = "";

    const amountWei = web3.utils.toWei(amount, "ether");

    await bankContract.methods.deposit().send({
      from: userAccount,
      value: amountWei,
    });

    showAlert(depositAlert, "Deposit successful!", "success");
    depositForm.reset();
    updateBalance();
    fetchTransactionHistory();
  } catch (error) {
    console.error("Error depositing:", error);
    showAlert(depositAlert, "Failed to deposit. " + error.message, "error");
  } finally {
    depositLoading.style.display = "none";
  }
}

// Handle withdraw
async function handleWithdraw(event) {
  event.preventDefault();

  if (!isConnected) {
    showAlert(withdrawAlert, "Please connect your wallet first", "error");
    return;
  }

  const amount = withdrawAmount.value;

  if (amount <= 0) {
    showAlert(withdrawAlert, "Please enter a valid amount", "error");
    return;
  }

  try {
    withdrawLoading.style.display = "flex";
    withdrawAlert.innerHTML = "";

    const amountWei = web3.utils.toWei(amount, "ether");

    await bankContract.methods.withdraw(amountWei).send({
      from: userAccount,
    });

    showAlert(withdrawAlert, "Withdrawal successful!", "success");
    withdrawForm.reset();
    updateBalance();
    fetchTransactionHistory();
  } catch (error) {
    console.error("Error withdrawing:", error);
    showAlert(withdrawAlert, "Failed to withdraw. " + error.message, "error");
  } finally {
    withdrawLoading.style.display = "none";
  }
}

async function fetchTransactionHistory() {
  if (!isConnected) return;

  try {
    historyLoading.style.display = "flex";
    transactionHistory.innerHTML = "";

    const currentBlock = await web3.eth.getBlockNumber();

    const fromBlock = Math.max(0, currentBlock - 9000);

    const depositEvents = await bankContract.getPastEvents("Deposit", {
      filter: { owner: userAccount },
      fromBlock: fromBlock,
      toBlock: "latest",
    });

    const withdrawEvents = await bankContract.getPastEvents("Withdraw", {
      filter: { owner: userAccount },
      fromBlock: fromBlock,
      toBlock: "latest",
    });

    const allEvents = [...depositEvents, ...withdrawEvents].sort(
      (a, b) => b.blockNumber - a.blockNumber
    );

    if (allEvents.length === 0) {
      transactionHistory.innerHTML =
        '<div class="transaction-item">No transactions found in recent blocks</div>';
    } else {
      allEvents.forEach((event) => {
        const isDeposit = event.event === "Deposit";
        const amount = web3.utils.fromWei(event.returnValues.amount, "ether");
        const date = new Date();

        const transactionItem = document.createElement("div");
        transactionItem.className = "transaction-item";
        transactionItem.innerHTML = `
            <div class="transaction-icon ${
              isDeposit ? "deposit-icon" : "withdraw-icon"
            }">
              <i class="fa-solid fa-${
                isDeposit ? "arrow-down" : "arrow-up"
              }"></i>
            </div>
            <div class="transaction-details">
              <div class="transaction-title">${
                isDeposit ? "Deposit" : "Withdrawal"
              }</div>
              <div class="transaction-time">${date.toLocaleString()}</div>
            </div>
            <div class="transaction-amount ${
              isDeposit ? "deposit-amount" : "withdraw-amount"
            }">
              ${isDeposit ? "+" : "-"}${amount} ETH
            </div>
          `;

        transactionHistory.appendChild(transactionItem);
      });
    }
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    transactionHistory.innerHTML =
      '<div class="transaction-item">Failed to load transaction history</div>';
  } finally {
    historyLoading.style.display = "none";
  }
}

// Set active tab
function setActiveTab(tabId) {
  tabs.forEach((tab) => {
    if (tab.getAttribute("data-tab") === tabId) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  tabContents.forEach((content) => {
    if (content.id === tabId + "Tab") {
      content.classList.add("active");
    } else {
      content.classList.remove("active");
    }
  });
}

// Show alert message
function showAlert(element, message, type) {
  element.innerHTML = `
      <div class="alert alert-${type}">
        <i class="fa-solid fa-${
          type === "success" ? "check-circle" : "circle-exclamation"
        }"></i>
        ${message}
      </div>
    `;
}

document.addEventListener("DOMContentLoaded", init);
