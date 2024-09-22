// Function to inject ethers.js
function injectEthersLibrary() {
  const ethersScript = document.createElement('script');
  ethersScript.src = "https://cdn.jsdelivr.net/npm/ethers@5.7.0/dist/ethers.umd.min.js";  // CDN link for ethers.js
  ethersScript.onload = () => {
    console.log("Ethers.js injected successfully.");
    replaceSportsTags();  // Run sports tag replacement logic after ethers.js is loaded
  };
  document.head.appendChild(ethersScript);
}

// Function to inject a script dynamically into the page context
function injectInlineScript(scriptContent) {
  const inlineScript = document.createElement('script');
  inlineScript.setAttribute('type', 'text/javascript');
  inlineScript.textContent = scriptContent;
  (document.head || document.documentElement).appendChild(inlineScript);
  inlineScript.onload = function () {
    inlineScript.remove();
  };
}

// Function to generate a unique ID (timestamp + index)
const generateUniqueId = (index) => {
  return `sports-container-${Date.now()}-${index}`;
};

// Function to replace custom //sports// ... //sports// tags
async function replaceSportsTags() {
  const spanElements = document.querySelectorAll('span');

  spanElements.forEach((span, index) => {
    const sportsTagRegex = /\/\/sports\/\/\s*(.*?)\s*\/\/sports\/\//g;
    let match;
    while ((match = sportsTagRegex.exec(span.textContent)) !== null) {
      const marketId = 1; // Example marketId, adjust as needed
      const uniqueId = generateUniqueId(index); // Generate a unique ID using index
      const question = ""; // Simulated question, replace with contract logic if necessary

      const containerHTML = `
       <div class="betting-container" id="container${uniqueId}">
        <div class="betting-header" id="header${uniqueId}">${question}</div>
      
        <p class="bet-title">Place Bet:</p>
      
        <div class="bet-amount-section" id="amountSection${uniqueId}">
          <div class="amount-control">
            <button class="amount-decrease" id="decreaseAmount${uniqueId}">-</button>
            <span class="amount-display" id="displayAmount${uniqueId}">$0</span>
            <button class="amount-increase" id="increaseAmount${uniqueId}">+</button>
          </div>
        </div>
        
        <div class="bet-button-group" id="buttonGroup${uniqueId}">
          <button class="bet-yes" id="betYes${uniqueId}">Yes</button>
          <button class="bet-no" id="betNo${uniqueId}">No</button>
        </div>

        <p class="bet-result" id="betResult${uniqueId}"></p> <!-- Displays bet result -->
      </div>
      `;

      const dynamicScript = `
        let currentBetAmount${uniqueId} = 0.00; // Start with 0 ETH
        const betAmountStep = 0.01; // Increment or decrement step is 0.01 ETH

        function updateBetAmountDisplay${uniqueId}() {
          document.getElementById('displayAmount${uniqueId}').innerText = "$" + currentBetAmount${uniqueId}.toFixed(2);
        }

        document.getElementById('increaseAmount${uniqueId}').addEventListener('click', function() {
          currentBetAmount${uniqueId} += betAmountStep;
          updateBetAmountDisplay${uniqueId}();
        });

        document.getElementById('decreaseAmount${uniqueId}').addEventListener('click', function() {
          if (currentBetAmount${uniqueId} - betAmountStep >= 0) {
            currentBetAmount${uniqueId} -= betAmountStep;
            updateBetAmountDisplay${uniqueId}();
          }
        });

        async function placeBet${uniqueId}(betOutcome) {
          const betAmount = currentBetAmount${uniqueId}; // Use the current amount displayed
          const contractAddress = "0xE8840Bfe795672a3b184Bc1E518a680585aadC9e"; // Your prediction market contract address

          if (typeof window.ethereum !== 'undefined') {
            try {
              const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
              const userAddress = accounts[0];
              const etherAmount = ethers.utils.parseEther(betAmount.toString()); // Convert to ether value
              const contractAbi = [
                {
                  "inputs": [
                    { "internalType": "uint256", "name": "marketId", "type": "uint256" },
                    { "internalType": "enum PredictionMarket.BetOutcome", "name": "outcome", "type": "uint8" }
                  ],
                  "name": "placeBet",
                  "outputs": [],
                  "stateMutability": "payable",
                  "type": "function"
                }
              ];

              const provider = new ethers.providers.Web3Provider(window.ethereum);
              const signer = provider.getSigner();
              const contract = new ethers.Contract(contractAddress, contractAbi, signer);

              const transaction = await contract.placeBet(${marketId}, betOutcome, { value: etherAmount });
              console.log(\`Transaction hash: \${transaction.hash}\`);

              const receipt = await transaction.wait();
              console.log(\`Transaction confirmed in block \${receipt.blockNumber}\`);

              document.getElementById('betResult${uniqueId}').innerText = "Success! Bet placed.";
              alert(\`Bet placed successfully! Transaction Hash: \${transaction.hash}\`);
            } catch (error) {
              alert(\`Error placing bet: \${error.message}\`);
            }
          } else {
            alert('MetaMask is not installed.');
          }
        }

        document.getElementById('betYes${uniqueId}').addEventListener('click', function() {
          placeBet${uniqueId}(0); // 0 for Yes
        });

        document.getElementById('betNo${uniqueId}').addEventListener('click', function() {
          placeBet${uniqueId}(1); // 1 for No
        });

        updateBetAmountDisplay${uniqueId}(); // Initialize amount display
      `;

      const spanHtml = span.innerHTML;
      span.innerHTML = spanHtml.replace(match[0], containerHTML);

      setTimeout(() => {
        injectInlineScript(dynamicScript); // Inject the generated JavaScript after a short delay
      }, 500);
    }
  });
}

// Function to observe DOM changes and re-run tag replacement
function observeDomChanges() {
  const observerTargetNode = document.body;
  const observerOptions = { childList: true, subtree: true };

  const mutationCallback = function (mutationsList) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        // Re-run replaceSportsTags whenever new DOM nodes are added
        replaceSportsTags();
      }
    }
  };

  const observer = new MutationObserver(mutationCallback);
  observer.observe(observerTargetNode, observerOptions);
}

// Function to inject custom CSS styles
function injectCustomStyles() {
  const customStyle = document.createElement('style');
  customStyle.textContent = `
    .betting-container {
      max-width: 100%;
      width: 320px;
      background-color: #ffffff;
      color: #0f1419;
      padding: 16px;
      border-radius: 12px;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border: 1px solid #eff3f4;
    }
    .betting-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      font-weight: bold;
      font-size: 18px;
      color: #0f1419;
    }
    .bet-title {
      margin-bottom: 8px;
      color: #536471;
      font-size: 14px;
    }
    .bet-button-group {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 16px;
    }
    .bet-yes, .bet-no {
      flex: 1;
      height: 40px;
      border: 1px solid #d1d5db;
      padding: 8px;
      border-radius: 9999px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: background-color 0.3s, box-shadow 0.3s;
    }
    .bet-yes {
      background-color: #1d9bf0;
      color: white;
    }
    .bet-no {
      background-color: #ffad1f;
      color: white;
    }
    .bet-yes:hover {
      background-color: #1a8cd8;
    }
    .bet-no:hover {
      background-color: #e6a719;
    }
    .bet-amount-section {
      margin-bottom: 16px;
    }
    .amount-control {
      display: flex;
      align-items: center;
      background-color: #f7f9f9;
      padding: 8px;
      border-radius: 12px;
      border: 1px solid #eff3f4;
    }
    .amount-decrease, .amount-increase {
      padding: 8px;
      background-color: #eff3f4;
      border: none;
      color: #1d9bf0;
      font-weight: bold;
      cursor: pointer;
      border-radius: 9999px;
      width: 36px;
      height: 36px;
    }
    .amount-display {
      flex: 1;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      color: #0f1419;
    }
    .bet-result {
      margin-top: 12px;
      color: #00ba7c;
      font-size: 14px;
      font-weight: bold;
    }
  `;
  document.head.appendChild(customStyle);
}

// Inject the necessary resources and start observing DOM changes
injectEthersLibrary();
injectCustomStyles();
observeDomChanges();