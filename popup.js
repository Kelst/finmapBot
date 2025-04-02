// popup.js
document.addEventListener('DOMContentLoaded', function() {
  const periodSelect = document.getElementById('periodSelect');
  const customDateInputs = document.getElementById('customDateInputs');
  const findCashWithdrawalsCheckbox = document.getElementById('findCashWithdrawals');
  const cashWithdrawalOptions = document.getElementById('cashWithdrawalOptions');
  const runButton = document.getElementById('runButton');
  const statusContainer = document.getElementById('statusContainer');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const cashWithdrawalTextInput = document.getElementById('cashWithdrawalText');

  // Set today's date as the default for date inputs
  const today = new Date().toISOString().split('T')[0];
  startDateInput.value = today;
  endDateInput.value = today;

  // Show/hide custom date inputs based on selection
  periodSelect.addEventListener('change', function() {
    customDateInputs.style.display = (this.value === 'custom') ? 'block' : 'none';
  });

  // Show/hide cash withdrawal options
  findCashWithdrawalsCheckbox.addEventListener('change', function() {
    cashWithdrawalOptions.style.display = this.checked ? 'block' : 'none';
  });

  // Run button click handler
  runButton.addEventListener('click', function() {
    runButton.disabled = true;
    statusContainer.innerHTML = ''; // Clear previous status on new run
    addStatusMessage('Запуск операції...', 'pending');

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
          addStatusMessage(`Помилка доступу до вкладки: ${chrome.runtime.lastError?.message || 'Не вдалося отримати активну вкладку.'}`, 'error');
          runButton.disabled = false;
          return;
      }
      const currentUrl = tabs[0].url;
      const tabId = tabs[0].id;

      if (!currentUrl || !currentUrl.includes('https://my.finmap.online/log')) {
        addStatusMessage('Помилка: Ви не на сторінці журналу Finmap (/log)', 'error');
        runButton.disabled = false;
        return;
      }

      const periodType = periodSelect.value;
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;
      const findCashWithdrawals = findCashWithdrawalsCheckbox.checked;
      const cashWithdrawalText = cashWithdrawalTextInput.value.trim();

      // --- Validation ---
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

      if (findCashWithdrawals && !cashWithdrawalText) {
        addStatusMessage('Помилка: Введіть текст для пошуку зняття готівки', 'error');
        runButton.disabled = false;
        return;
      }

      // --- Send Command to Content Script ---
      // Content script handles the sequence: ensure "All Time" then filter.
      addStatusMessage('Відправка команди на фільтрацію...', 'pending');
      chrome.tabs.sendMessage(
        tabId,
        {
          action: "filterByDate", // Send the main action directly
          periodType: periodType,
          startDate: startDate,
          endDate: endDate,
          findCashWithdrawals: findCashWithdrawals,
          cashWithdrawalText: cashWithdrawalText
        },
        function(response) { // Callback for the response FROM the filterByDate handler
          if (chrome.runtime.lastError) {
             // Handle potential errors like tab closed, script not injected, etc.
             addStatusMessage(`Помилка зв'язку: ${chrome.runtime.lastError.message}`, 'error');
             console.error("Messaging error:", chrome.runtime.lastError);
             runButton.disabled = false;
          } else if (response && response.status === 'started_filtering') {
              // Confirmation that the content script received and started the process
              addStatusMessage('Скрипт сторінки розпочав обробку.', 'pending');
              // Button remains disabled, waiting for final status via the general listener
          } else if (response && response.status === 'failed_prerequisite') {
              // Handle failure during the "ensureAllTimeSelected" step within content.js
              addStatusMessage(`Помилка передумови: ${response.error || 'Не вдалося встановити "За весь час"'}. Фільтрацію скасовано.`, 'error');
              runButton.disabled = false;
          } else if (response && response.status && response.status.startsWith('failed')) {
               // Handle other specific failures reported immediately
               addStatusMessage(`Помилка запуску: ${response.error || 'Невідома помилка'}`, 'error');
               runButton.disabled = false;
          } else if (!response) {
               // Handle case where content script doesn't respond (might not be injected or listener failed)
               addStatusMessage('Сторінка не відповіла на запит. Перезавантажте сторінку та спробуйте знову.', 'error');
               runButton.disabled = false;
          } else {
               // Handle unexpected responses
               addStatusMessage('Отримано неочікувану відповідь від сторінки.', 'warning');
               console.warn("Unexpected response:", response);
               // Decide whether to disable button based on response; safer to keep it enabled here
               // runButton.disabled = false; // Or keep it disabled if unsure
          }
        }
      );
    });
  });

  // General Listener for status updates from content script's sendStatus()
 // popup.js (inside DOMContentLoaded)

  // General Listener for status updates from content script's sendStatus()
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === 'status') {
      // Display the basic text status message
      addStatusMessage(message.text, message.status);

      // Check if this is the final message AND contains report data
      if (message.done === true && message.data) {
         const report = message.data;
         addStatusMessage('--- Початок Звіту ---', 'info'); // Use a neutral status like 'info'
         if (report.count > 0) {
             // Display summary again for clarity
             addStatusMessage(`Знайдено: ${report.count}, Сума: ${report.totalAmount.toFixed(2)} ₴`, 'info');
             // Optionally display a few transaction details (be careful with long comments)
             report.transactions.slice(0, 5).forEach((tx, index) => { // Show first 5
                 addStatusMessage(`${index + 1}. ${tx.date} ${tx.time}: ${tx.amount} ₴ (${tx.comment.substring(0, 30)}...)`, 'info');
             });
             if (report.count > 5) {
                 addStatusMessage(`... та ще ${report.count - 5} транзакцій (див. консоль сторінки для повного списку).`, 'info');
             }
         } else if (findCashWithdrawalsCheckbox.checked) { // Check if search was active
            addStatusMessage('Відповідних транзакцій зняття готівки не знайдено.', 'info');
         } else {
             addStatusMessage('Пошук зняття готівки не виконувався.', 'info');
         }
         addStatusMessage('--- Кінець Звіту ---', 'info');

         // Re-enable button now that the final report is processed
         runButton.disabled = false;

      } else if (message.done === true) {
          // If it's the final message but has NO report data (e.g., error occurred before report)
          // Or if filtering finished without searching for cash withdrawals
          if (message.status !== 'success' && message.status !== 'warning') { // Only add extra if not already covered by report logic
             addStatusMessage('Операцію завершено.', message.status);
          }
          runButton.disabled = false; // Re-enable button on any final 'done' message
      }
    }
     // return false; // No async response needed from this listener
  });

 // Need to add a CSS style for 'info' status if using it
 /* Example in popup.html <style> tag:
    .status-info {
        color: #555; // Or another neutral color
        font-style: italic;
    }
 */

  // Function to add status message to UI and storage
  function addStatusMessage(message, status) {
    const statusItem = document.createElement('div');
    statusItem.classList.add('status-item');
    statusItem.classList.add(`status-${status}`);
    // Sanitize message slightly before displaying
    statusItem.textContent = message.replace(/<|>/g, ''); // Basic HTML tag removal
    statusContainer.appendChild(statusItem);
    // Auto-scroll to bottom
    statusContainer.scrollTop = statusContainer.scrollHeight;

    // Save to storage (optional, for persistence across popup closes)
    chrome.storage.local.get(['statusMessages'], function(result) {
      const messages = result.statusMessages || [];
      messages.push({text: message, status: status, timestamp: new Date().toISOString()});
      // Limit stored messages
      const MAX_STORED_MESSAGES = 30;
      while (messages.length > MAX_STORED_MESSAGES) {
        messages.shift();
      }
      chrome.storage.local.set({statusMessages: messages});
    });
  }

  // Load previous status messages from storage on popup open
  chrome.storage.local.get(['statusMessages'], function(result) {
    if (result.statusMessages && result.statusMessages.length > 0) {
      statusContainer.innerHTML = ''; // Clear default message
      result.statusMessages.forEach(item => {
          // Recreate the element on load
         const statusItem = document.createElement('div');
         statusItem.classList.add('status-item');
         statusItem.classList.add(`status-${item.status}`);
         statusItem.textContent = item.text.replace(/<|>/g, ''); // Basic sanitize
         statusContainer.appendChild(statusItem);
      });
       statusContainer.scrollTop = statusContainer.scrollHeight; // Scroll to bottom on load
    } else {
        statusContainer.innerHTML = '<div class="status-item status-pending">Готовий до запуску</div>'; // Default message
    }
  });

}); // End DOMContentLoaded