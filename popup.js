// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const periodSelect = document.getElementById('periodSelect');
    const customDateInputs = document.getElementById('customDateInputs');
    const runButton = document.getElementById('runButton');
    const statusContainer = document.getElementById('statusContainer');
    
    // Set today's date as the default for date inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = today;
    
    // Show/hide custom date inputs based on selection
    periodSelect.addEventListener('change', function() {
      if (periodSelect.value === 'custom') {
        customDateInputs.style.display = 'block';
      } else {
        customDateInputs.style.display = 'none';
      }
    });
    
    // Run button click handler
    runButton.addEventListener('click', function() {
      // Disable button during execution
      runButton.disabled = true;
      
      // Clear previous status
      statusContainer.innerHTML = '';
      
      // Log initial status
      addStatusMessage('Запуск операції...', 'pending');
      
      // Check if we're on the correct page
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentUrl = tabs[0].url;
        
        if (!currentUrl.includes('https://my.finmap.online/log')) {
          addStatusMessage('Помилка: Ви не на сторінці журналу Finmap', 'error');
          runButton.disabled = false;
          return;
        }
        
        // Send message to content script
        chrome.tabs.sendMessage(
          tabs[0].id,
          { 
            action: "selectAllTime",
            periodType: periodSelect.value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value
          },
          function(response) {
            if (response && response.status === 'started') {
              addStatusMessage('Операція розпочата на сторінці', 'pending');
            } else {
              addStatusMessage('Помилка: Не вдалося зв\'язатися з сторінкою', 'error');
              runButton.disabled = false;
            }
          }
        );
      });
    });
    
    // Listen for status updates from content script
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      if (message.type === 'status') {
        addStatusMessage(message.text, message.status);
        
        if (message.status === 'success' && message.done) {
          runButton.disabled = false;
        } else if (message.status === 'error') {
          runButton.disabled = false;
        }
      }
      return true;
    });
    
    // Function to add status message
    function addStatusMessage(message, status) {
      const statusItem = document.createElement('div');
      statusItem.classList.add('status-item');
      statusItem.classList.add(`status-${status}`);
      statusItem.textContent = message;
      statusContainer.appendChild(statusItem);
      statusContainer.scrollTop = statusContainer.scrollHeight;
      
      // Also save to storage for persistence
      chrome.storage.local.get(['statusMessages'], function(result) {
        const messages = result.statusMessages || [];
        messages.push({text: message, status: status, timestamp: new Date().getTime()});
        
        // Limit to last 20 messages
        if (messages.length > 20) {
          messages.shift();
        }
        
        chrome.storage.local.set({statusMessages: messages});
      });
    }
    
    // Load previous status messages from storage
    chrome.storage.local.get(['statusMessages'], function(result) {
      if (result.statusMessages && result.statusMessages.length > 0) {
        statusContainer.innerHTML = '';
        result.statusMessages.forEach(item => {
          const statusItem = document.createElement('div');
          statusItem.classList.add('status-item');
          statusItem.classList.add(`status-${item.status}`);
          statusItem.textContent = item.text;
          statusContainer.appendChild(statusItem);
        });
      }
    });
  });