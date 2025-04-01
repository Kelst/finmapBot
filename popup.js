// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const periodSelect = document.getElementById('periodSelect');
    const customDateInputs = document.getElementById('customDateInputs');
    const findCashWithdrawalsCheckbox = document.getElementById('findCashWithdrawals');
    const cashWithdrawalOptions = document.getElementById('cashWithdrawalOptions');
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
    
    // Show/hide cash withdrawal options
    findCashWithdrawalsCheckbox.addEventListener('change', function() {
      cashWithdrawalOptions.style.display = this.checked ? 'block' : 'none';
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
        
        // Отримуємо значення вибраного періоду
        const periodType = periodSelect.value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        // Отримуємо значення опцій зняття готівки
        const findCashWithdrawals = findCashWithdrawalsCheckbox.checked;
        const cashWithdrawalText = document.getElementById('cashWithdrawalText').value.trim();
        
        // Валідація дат для користувацького періоду
        if (periodType === 'custom') {
          if (!startDate || !endDate) {
            addStatusMessage('Помилка: Виберіть початкову та кінцеву дати', 'error');
            runButton.disabled = false;
            return;
          }
          
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);
          
          if (endDateObj < startDateObj) {
            addStatusMessage('Помилка: Кінцева дата не може бути раніше за початкову', 'error');
            runButton.disabled = false;
            return;
          }
        }
        
        // Валідація тексту для пошуку зняття готівки
        if (findCashWithdrawals && !cashWithdrawalText) {
          addStatusMessage('Помилка: Введіть текст для пошуку зняття готівки', 'error');
          runButton.disabled = false;
          return;
        }
        
        // Спочатку відправляємо запит на встановлення "За весь час"
        chrome.tabs.sendMessage(
          tabs[0].id,
          { 
            action: "selectAllTime"
          },
          function(response) {
            if (response && response.status === 'started') {
              addStatusMessage('Встановлюємо "За весь час"...', 'pending');
              
              // Після успішної відповіді слухаємо статус операції
              let statusListener = function(message, sender, sendResponse) {
                if (message.type === 'status' && message.done) {
                  //// Коли операція "За весь час" завершена, починаємо фільтрацію
                  chrome.runtime.onMessage.removeListener(statusListener);
                  
                  // Відправляємо запит на фільтрацію за датою з опцією пошуку зняття готівки
                  chrome.tabs.sendMessage(
                    tabs[0].id,
                    { 
                      action: "filterByDate",
                      periodType: periodType,
                      startDate: startDate,
                      endDate: endDate,
                      findCashWithdrawals: findCashWithdrawals,
                      cashWithdrawalText: cashWithdrawalText
                    },
                    function(response) {
                      if (response && response.status === 'started') {
                        if (findCashWithdrawals) {
                          addStatusMessage('Починаємо фільтрацію за датою та пошук зняття готівки...', 'pending');
                        } else {
                          addStatusMessage('Починаємо фільтрацію за датою...', 'pending');
                        }
                      } else {
                        addStatusMessage('Помилка: Не вдалося зв\'язатися з сторінкою для фільтрації', 'error');
                        runButton.disabled = false;
                      }
                    }
                  );
                }
              };
              
              chrome.runtime.onMessage.addListener(statusListener);
              
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
        } else if (message.status === 'warning' && message.done) {
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