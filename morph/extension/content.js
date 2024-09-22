// Function to inject ethers.js
function injectEthers() {
  const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/starknet@7.0.0/dist/index.global.min.js";  // CDN link for starknet.js
    script.onload = () => {
        console.log("Starknet.js injected successfully.");
        replaceFanTags();  // Run your fan tag replacement logic after starknet.js is loaded
    };
    document.head.appendChild(script);
  replaceFanTags();  // Run your fan tag replacement logic directly
}

// Function to inject a script into the page context (if needed)
function injectScript(code) {
  const script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.textContent = code;
  (document.head || document.documentElement).appendChild(script);
  script.onload = function () {
      script.remove();
  };
}

// Function to generate a unique ID (timestamp + index)
const generateUniqueId = (index) => {
  return `fan-container-${Date.now()}-${index}`;
};

// Function to replace custom //fan// ... //fan// tags
async function replaceFanTags() {
  const spans = document.querySelectorAll('span');

  spans.forEach((span, index) => {
      const fanRegex = /\/\/fan\/\/\s*(.*?)\s*\/\/fan\/\//g;
      let match;
      while ((match = fanRegex.exec(span.textContent)) !== null) {
          const marketId = 1; // Extract marketId from the match

          const uniqueId = 423432; // Generate unique ID using the index
          const randomNumber = uniqueId; // Reuse the uniqueId for DOM manipulation

          // Simulating fetching a question from the smart contract (replace this with actual contract logic)
          const question = "will leipzig win?";

          const newHtml = `
     <div class="container" id="container${randomNumber}">
      <div class="header" id="header${randomNumber}">${question}</div>
    
      <p class="bet-title">Place Bet:</p>
    
      <div class="amount-section" id="amountSection${randomNumber}">
        <div class="amount-control">
          <button class="amount-decrease" id="decreaseAmount${randomNumber}">-</button>
          <span class="amount-display" id="displayAmount${randomNumber}">$0</span>
          <button class="amount-increase" id="increaseAmount${randomNumber}">+</button>
        </div>
      </div>
      
      <div class="button-group" id="buttonGroup${randomNumber}">
        <button class="button-yes" id="betYes${randomNumber}">Yes</button>
        <button class="button-no" id="betNo${randomNumber}">No</button>
      </div>

      <p class="bet-result" id="betResult${randomNumber}"></p> <!-- Added for displaying bet result -->
    </div>
    `;

          const newJs = `
      let currentAmount${randomNumber} = 0.00; // Start with 0 ETH
      const amountStep = 0.01; // Increment or decrement step is 0.01 ETH

      function splitUint256(value) {
          const low = (value & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).toString();
          const high = (value >> BigInt(128)).toString();
          return { low, high };
      }

      function updateAmountDisplay${randomNumber}() {
        document.getElementById('displayAmount${randomNumber}').innerText = "$" + currentAmount${randomNumber}.toFixed(2);
      }

      document.getElementById('increaseAmount${randomNumber}').addEventListener('click', function() {
        currentAmount${randomNumber} += amountStep;
        updateAmountDisplay${randomNumber}();
      });

      document.getElementById('decreaseAmount${randomNumber}').addEventListener('click', function() {
        if (currentAmount${randomNumber} - amountStep >= 0) {
          currentAmount${randomNumber} -= amountStep;
          updateAmountDisplay${randomNumber}();
        }
      });

      async function placeBet${randomNumber}(betOutcome) {
        const amount = currentAmount${randomNumber}; // Use the current amount displayed
        const contractAddress = "0x06d5c3178f8bc73fad618466398ab5c6cb1bc651ede47749346dc1c584c42f09"; // Your StarkNet prediction market contract address

        if (typeof window.starknet !== 'undefined') {
          try {
            await window.starknet.enable();
            const accountAddress = window.starknet.selectedAddress;

            const betAmount = BigInt(Math.round(amount * 1e18)); // Convert amount to wei

            const marketId = BigInt(${marketId});
            const betOutcomeValue = BigInt(betOutcome);

            const betAmountSplit = splitUint256(betAmount);
            const marketIdSplit = splitUint256(marketId);

            const calldata = [
                marketIdSplit.low, marketIdSplit.high,
                betOutcomeValue.toString(),
                betAmountSplit.low, betAmountSplit.high
            ];

            const transaction = {
              contractAddress: contractAddress,
              entrypoint: 'place_bet',
              calldata: calldata
            };

            const txHash = await window.starknet.sendTransaction(transaction);

            console.log(\`Transaction hash: \${txHash}\`);

            // Display the amount betted after transaction is confirmed
            document.getElementById('betResult${randomNumber}').innerText = "You bet $" + amount.toFixed(2) + " successfully! Transaction Hash: " + txHash;

            alert(\`Bet placed successfully! Transaction Hash: \${txHash}\`);
          } catch (error) {
            alert(\`Error: \${error.message}\`);
          }
        } else {
          alert('StarkNet wallet is not installed');
        }
      }

      document.getElementById('betYes${randomNumber}').addEventListener('click', function() {
        placeBet${randomNumber}(0); // 0 for Yes
      });

      document.getElementById('betNo${randomNumber}').addEventListener('click', function() {
        placeBet${randomNumber}(1); // 1 for No
      });

      updateAmountDisplay${randomNumber}(); // Initialize the amount display
    `;

          const spanHtml = span.innerHTML;
          span.innerHTML = spanHtml.replace(match[0], newHtml);

          setTimeout(() => {
              injectScript(newJs); // Inject the JavaScript after a short delay
          }, 500);
      }
  });
}

// Use MutationObserver to observe DOM changes
function observeDomChanges() {
  const targetNode = document.body;
  const observerConfig = { childList: true, subtree: true };

  const callback = function (mutationsList, observer) {
      for (const mutation of mutationsList) {
          if (mutation.type === 'childList') {
              // Re-run the replaceFanTags function whenever new DOM nodes are added
              replaceFanTags();
          }
      }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, observerConfig);
}

// Function to inject CSS styles for the component
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
  .container {
    max-width: 100%;
    width: 320px;
    background-color: #1a202c;
    color: white;
    padding: 16px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
  }
  .header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    font-weight: bold;
  }
  .bet-title {
    margin-bottom: 8px;
  }
  .button-group {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 16px;
  }
  .button-yes, .button-no {
    flex: 1;
    height: 48px;
    border: 2px solid black;
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s, box-shadow 0.3s;
  }
  .button-yes {
    background-color: #22d3ee;
    color: black;
  }
  .button-no {
    background-color: #facc15;
    color: black;
  }
  .button-yes:hover {
    background-color: #67e8f9;
    box-shadow: 2px 2px 0px rgba(0, 0, 0, 1);
  }
  .button-no:hover {
    background-color: #fde047;
    box-shadow: 2px 2px 0px rgba(0, 0, 0, 1);
  }
  .amount-section {
    margin-bottom: 16px;
  }
  .amount-label {
    display: block;
    margin-bottom: 8px;
  }
  .amount-control {
    display: flex;
    align-items: center;
    background-color: #2d3748;
    padding: 8px;
    border-radius: 8px;
  }
  .amount-decrease, .amount-increase {
    padding: 8px;
    background-color: #2d3748;
    border: none;
    color: white;
    cursor: pointer;
  }
  .amount-decrease:hover, .amount-increase:hover {
    background-color: #4a5568;
  }
  .amount-display {
    flex: 1;
    text-align: center;
    font-size: 16px;
  }
  .bet-result {
    margin-top: 12px;
    color: #38a169;
    font-size: 14px;
  }
  .login-button {
    width: 100%;
    background-color: #f9a8d4;
    color: black;
    padding: 12px;
    border-radius: 8px;
    border: 2px solid black;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s, box-shadow 0.3s;
  }
  .login-button:hover {
    box-shadow: 2px 2px 0px rgba(0, 0, 0, 1);
  }
  .login-button:active {
    background-color: #f472b6;
  }
`;
  document.head.appendChild(style);
}

// Inject CSS styles and then start replacing fan tags
injectEthers();
injectStyles();
observeDomChanges(); // Start observing DOM changes