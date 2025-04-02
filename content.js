// content.js

// --- Configuration ---
const ALL_TIME_BUTTON_SELECTOR = 'button.MuiButtonBase-root.MuiButton-root.MuiButton-text'; // Більш загальний селектор для кнопки дати
const ALL_TIME_BUTTON_TEXT_SELECTOR = 'p.MuiTypography-root.jss367'; // Селектор для тексту всередині кнопки дати (уточнено)
const ALL_TIME_MENU_ITEM_SELECTOR = 'li.MuiMenuItem-root div > p.MuiTypography-root'; // Селектор для тексту "За весь час" в меню
const ALL_TIME_TEXT = 'За весь час';
const TRANSACTION_LIST_SELECTOR = '.ReactVirtualized__Grid.ReactVirtualized__List'; // Селектор контейнера списку
const TRANSACTION_ROW_SELECTOR = '.jss542.jss543.cypress-log-row'; // Селектор рядка транзакції
const DATE_SELECTOR = '.jss588 p.MuiTypography-root.jss590'; // Селектор для дати в рядку
const AMOUNT_SELECTOR = '.jss599 p.MuiTypography-root.jss601'; // Селектор для суми
const COMMENT_SELECTOR = '.jss553 p.MuiTypography-root.jss545'; // Селектор для коментаря

const SCROLL_STEP = 300; // Крок прокрутки в пікселях
const SCROLL_DELAY = 350; // Затримка між кроками прокрутки в мс
const MAX_WAIT_TIME = 10000; // Максимальний час очікування елемента в мс
const HIGHLIGHT_PERIOD_COLOR = 'rgba(144, 238, 144, 0.3)'; // Світло-зелений для періоду
const HIGHLIGHT_MATCH_COLOR = 'rgba(255, 215, 0, 0.4)'; // Золотистий для збігів зняття готівки
const HIGHLIGHT_BORDER = '1px solid #00B28E';
// Додаємо стилі для модального вікна
// Функція для створення модального вікна результатів
function showResultsModal(reportData, periodInfo) {
  // Перевірка, чи вже існує модальне вікно
  if (document.querySelector('.result-modal-overlay')) {
    document.querySelector('.result-modal-overlay').remove();
  }

  // Створюємо елементи для модального вікна
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'result-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'result-modal';

  // Заголовок модального вікна
  const header = document.createElement('div');
  header.className = 'result-modal-header';
  
  const title = document.createElement('h3');
  title.className = 'result-modal-title';
  title.textContent = 'Результати пошуку';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'result-modal-close';
  closeButton.innerHTML = '&times;';
  closeButton.setAttribute('aria-label', 'Закрити');
  closeButton.onclick = () => modalOverlay.remove();
  
  header.appendChild(title);
  header.appendChild(closeButton);

  // Контент модального вікна
  const content = document.createElement('div');
  content.className = 'result-modal-content';

  // Блок з інформацією про період
  const summary = document.createElement('div');
  summary.className = 'result-modal-summary';
  
  const periodText = document.createElement('p');
  periodText.innerHTML = `<strong>Період:</strong> ${periodInfo}`;
  summary.appendChild(periodText);
  
  const totalText = document.createElement('p');
  if (reportData.count > 0) {
    totalText.innerHTML = `<strong>Знайдено транзакцій:</strong> <span class="highlight">${reportData.count}</span>`;
  } else {
    totalText.innerHTML = `<strong>Знайдено транзакцій:</strong> 0`;
  }
  summary.appendChild(totalText);
  
  if (reportData.count > 0) {
    const amountText = document.createElement('p');
    amountText.innerHTML = `<strong>Загальна сума:</strong> <span class="highlight">${reportData.totalAmount.toFixed(2)} ₴</span>`;
    summary.appendChild(amountText);
  }
  
  content.appendChild(summary);

  // Таблиця з транзакціями або повідомлення про відсутність результатів
  if (reportData.count > 0) {
    const table = document.createElement('table');
    table.className = 'result-modal-table';
    
    // Заголовок таблиці
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    ['Дата', 'Час', 'Сума', 'Коментар'].forEach(headerText => {
      const th = document.createElement('th');
      th.textContent = headerText;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Тіло таблиці
    const tbody = document.createElement('tbody');
    
    reportData.transactions.forEach(tx => {
      const row = document.createElement('tr');
      
      const dateCell = document.createElement('td');
      dateCell.textContent = tx.date;
      row.appendChild(dateCell);
      
      const timeCell = document.createElement('td');
      timeCell.textContent = tx.time;
      row.appendChild(timeCell);
      
      const amountCell = document.createElement('td');
      amountCell.textContent = `${tx.amount.toFixed(2)} ₴`;
      amountCell.style.color = tx.amount < 0 ? '#e74c3c' : '#2ecc71';
      row.appendChild(amountCell);
      
      const commentCell = document.createElement('td');
      commentCell.textContent = tx.comment;
      row.appendChild(commentCell);
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    content.appendChild(table);
  } else {
    // Повідомлення про відсутність результатів
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'result-modal-empty';
    emptyMessage.innerHTML = `
      <i>📋</i>
      <p>Транзакцій зняття готівки за вказаними критеріями не знайдено.</p>
    `;
    content.appendChild(emptyMessage);
  }

  // Блок з кнопками для дій
  const actions = document.createElement('div');
  actions.className = 'result-modal-actions';
  
  // Кнопка для закриття
  const closeAction = document.createElement('button');
  closeAction.className = 'secondary';
  closeAction.textContent = 'Закрити';
  closeAction.onclick = () => modalOverlay.remove();
  
  // Кнопка для копіювання як тексту
  const copyTextButton = document.createElement('button');
  copyTextButton.textContent = 'Копіювати як текст';
  copyTextButton.onclick = () => {
    copyResultsAsText(reportData, periodInfo);
  };
  
  // Кнопка для копіювання як CSV
  const copyCSVButton = document.createElement('button');
  copyCSVButton.textContent = 'Копіювати як CSV';
  copyCSVButton.onclick = () => {
    copyResultsAsCSV(reportData);
  };
  
  if (reportData.count > 0) {
    actions.appendChild(closeAction);
    actions.appendChild(copyCSVButton);
    actions.appendChild(copyTextButton);
  } else {
    actions.appendChild(closeAction);
  }

  // Збираємо модальне вікно
  modal.appendChild(header);
  modal.appendChild(content);
  modal.appendChild(actions);
  modalOverlay.appendChild(modal);
  
  // Додаємо модальне вікно до сторінки
  document.body.appendChild(modalOverlay);
  
  // Обробник клавіші Escape для закриття
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      modalOverlay.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// Функція для копіювання результатів як форматованого тексту
function copyResultsAsText(reportData, periodInfo) {
  let textResult = `=== Результати пошуку зняття готівки ===\n`;
  textResult += `Період: ${periodInfo}\n`;
  textResult += `Знайдено транзакцій: ${reportData.count}\n`;
  
  if (reportData.count > 0) {
    textResult += `Загальна сума: ${reportData.totalAmount.toFixed(2)} ₴\n\n`;
    textResult += `Транзакції:\n`;
    
    reportData.transactions.forEach((tx, index) => {
      textResult += `${index + 1}. Дата: ${tx.date}, Час: ${tx.time}, Сума: ${tx.amount.toFixed(2)} ₴\n`;
      textResult += `   Коментар: ${tx.comment}\n`;
    });
  }
  
  copyToClipboard(textResult);
}

// Функція для копіювання результатів як CSV
function copyResultsAsCSV(reportData) {
  if (reportData.count === 0) return;
  
  // Заголовки CSV
  let csvContent = 'Дата,Час,Сума,Коментар\n';
  
  // Дані про транзакції
  reportData.transactions.forEach(tx => {
    // Екрануємо коми і подвійні лапки в коментарі
    const safeComment = tx.comment.replace(/"/g, '""');
    csvContent += `${tx.date},${tx.time},${tx.amount.toFixed(2)},"${safeComment}"\n`;
  });
  
  copyToClipboard(csvContent);
}

// Допоміжна функція для копіювання тексту в буфер обміну
function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      // Показуємо повідомлення про успішне копіювання
      const notification = document.createElement('div');
      notification.className = 'copy-success';
      notification.textContent = 'Скопійовано в буфер обміну!';
      document.body.appendChild(notification);
      
      // Видаляємо повідомлення через 2 секунди
      setTimeout(() => {
        notification.remove();
      }, 2000);
    })
    .catch(err => {
      console.error('Помилка копіювання тексту: ', err);
    });
}
function injectModalStyles() {
  if (document.getElementById('finmap-bot-modal-styles')) return;
  
  const styleSheet = document.createElement('style');
  styleSheet.id = 'finmap-bot-modal-styles';
  styleSheet.innerHTML = `
  /* Стилі для модального вікна результатів */
  .result-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .result-modal {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: modalAppear 0.3s ease-out;
  }

  @keyframes modalAppear {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .result-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background-color: #00B28E;
    color: white;
  }

  .result-modal-title {
    font-size: 18px;
    font-weight: 500;
    margin: 0;
  }

  .result-modal-close {
    background: none;
    border: none;
    color: white;
    font-size: 22px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    opacity: 0.8;
  }

  .result-modal-close:hover {
    opacity: 1;
  }

  .result-modal-content {
    padding: 20px;
    overflow-y: auto;
  }

  .result-modal-summary {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
  }

  .result-modal-summary p {
    margin: 6px 0;
    font-size: 15px;
  }

  .result-modal-summary .highlight {
    font-weight: 600;
    color: #00B28E;
  }

  .result-modal-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }

  .result-modal-table th {
    background-color: #f5f5f5;
    padding: 8px;
    text-align: left;
    font-weight: 500;
    border-bottom: 2px solid #eee;
  }

  .result-modal-table td {
    padding: 8px;
    border-bottom: 1px solid #eee;
    font-size: 14px;
  }

  .result-modal-table tr:hover {
    background-color: #f9f9f9;
  }

  .result-modal-actions {
    padding: 15px 20px;
    background-color: #f5f5f5;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .result-modal-actions button {
    background-color: #00B28E;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }

  .result-modal-actions button:hover {
    background-color: #009579;
  }

  .result-modal-actions button.secondary {
    background-color: #e0e0e0;
    color: #333;
  }

  .result-modal-actions button.secondary:hover {
    background-color: #d0d0d0;
  }

  .result-modal-empty {
    text-align: center;
    padding: 30px 0;
    color: #666;
  }

  .result-modal-empty i {
    font-size: 40px;
    color: #ddd;
    margin-bottom: 10px;
    display: block;
  }

  .copy-success {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #2ecc71;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1001;
    animation: fadeInOut 2s ease-in-out;
  }

  @keyframes fadeInOut {
    0% { opacity: 0; }
    15% { opacity: 1; }
    85% { opacity: 1; }
    100% { opacity: 0; }
  }
  `;
  
  document.head.appendChild(styleSheet);
}
// --- Helper Functions ---

/**
 * Sends a status message back to the popup.
 * @param {string} text The message text.
 * @param {'pending'|'success'|'error'|'warning'} status The status type.
 * @param {boolean} done Indicates if the overall operation is finished.
 */
function sendStatus(text, status = 'pending', done = false) {
  console.log(`[Finmap Bot Status] ${status.toUpperCase()}: ${text}`);
  try {
    chrome.runtime.sendMessage({ type: 'status', text, status, done });
  } catch (error) {
    console.warn("Could not send message to popup. It might be closed.", error);
  }
}

/**
 * Waits for an element to appear in the DOM.
 * @param {string} selector CSS selector for the element.
 * @param {Element} parentElement Optional parent element to search within.
 * @param {number} timeout Maximum time to wait in milliseconds.
 * @returns {Promise<Element|null>} Resolves with the element or null if timed out.
 */
function waitForElement(selector, parentElement = document, timeout = MAX_WAIT_TIME) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const element = parentElement.querySelector(selector);
      if (element) {
        clearInterval(interval);
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        console.warn(`Element "${selector}" not found within ${timeout}ms.`);
        resolve(null);
      }
    }, 100); // Check every 100ms
  });
}

/**
 * Simple delay function.
 * @param {number} ms Time to wait in milliseconds.
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Month mapping for Ukrainian date parsing
const monthMapUA = {
  'січ': 0, 'лют': 1, 'бер': 2, 'кві': 3, 'тра': 4, 'чер': 5,
  'лип': 6, 'сер': 7, 'вер': 8, 'жов': 9, 'лис': 10, 'гру': 11,
  'січня': 0, 'лютого': 1, 'березня': 2, 'квітня': 3, 'травня': 4, 'червня': 5,
  'липня': 6, 'серпня': 7, 'вересня': 8, 'жовтня': 9, 'листопада': 10, 'грудня': 11
};

/**
 * Parses Ukrainian date strings (e.g., "1 квіт 2025", "Сьогодні", "Вчора").
 * @param {string} dateString The date string to parse.
 * @returns {Date|null} Parsed Date object (set to 00:00:00) or null if parsing fails.
 */
function parseDateUA(dateString) {
  if (!dateString) return null;
  const normalizedDateString = dateString.trim().toLowerCase();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (normalizedDateString.includes('сьогодні')) {
      return today;
  }
  if (normalizedDateString.includes('вчора')) {
      return yesterday;
  }

  // Match "DD <month> YYYY" format
  const match = normalizedDateString.match(/(\d{1,2})\s+([а-яіїєґ']+)\s+(\d{4})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2].substring(0, 3); // Use first 3 chars
    const year = parseInt(match[3], 10);

    if (!isNaN(day) && !isNaN(year) && monthStr in monthMapUA) {
      const month = monthMapUA[monthStr];
      try {
        // Check for invalid date construction (e.g., 31 квіт)
        const tempDate = new Date(year, month, day);
        if (tempDate.getFullYear() === year && tempDate.getMonth() === month && tempDate.getDate() === day) {
             tempDate.setHours(0, 0, 0, 0); // Normalize time
             return tempDate;
        } else {
             console.warn(`Недійсна дата (день/місяць): ${dateString}`);
             return null;
        }
      } catch (e) {
        console.error(`Помилка розбору дати: ${dateString}`, e);
        return null;
      }
    }
  }

  console.warn(`Не вдалося розпізнати формат дати: ${dateString}`);
  return null;
}


/**
 * Formats a Date object into YYYY-MM-DD string.
 * @param {Date} date The Date object.
 * @returns {string} Formatted date string.
 */
function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) {
      return 'Invalid Date';
  }
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Applies or removes highlighting styles to a transaction row.
 * @param {Element} rowElement The transaction row element.
 * @param {'period'|'match'|null} type The type of highlight ('period', 'match') or null to remove.
 */
function highlightRow(rowElement, type) {
  if (!rowElement) return;
  // Reset styles first
  rowElement.style.backgroundColor = '';
  rowElement.style.border = '';
  rowElement.style.boxSizing = ''; // Reset box-sizing if border was added

  if (type === 'period') {
    rowElement.style.backgroundColor = HIGHLIGHT_PERIOD_COLOR;
    rowElement.style.border = HIGHLIGHT_BORDER;
    rowElement.style.boxSizing = 'border-box'; // Ensure border doesn't affect layout
  } else if (type === 'match') {
    rowElement.style.backgroundColor = HIGHLIGHT_MATCH_COLOR;
    rowElement.style.border = HIGHLIGHT_BORDER;
     rowElement.style.boxSizing = 'border-box';
  }
}

/**
 * Clears all highlights from transaction rows.
 */
function clearAllHighlights() {
    console.log('Очищення попередніх виділень...');
    const highlightedRows = document.querySelectorAll(`${TRANSACTION_ROW_SELECTOR}[style*="background-color"]`);
    highlightedRows.forEach(row => highlightRow(row, null));
    console.log(`Очищено виділення з ${highlightedRows.length} рядків.`);
}


// --- Main Logic ---

/**
 * Ensures the date filter is set to "За весь час".
 * @returns {Promise<boolean>} True if successful or already set, false otherwise.
 */
async function ensureAllTimeSelected() {
  sendStatus('Крок 1: Перевірка фільтра "За весь час"...');
  try {
    // Find the main date filter button more reliably
    const dateButtons = Array.from(document.querySelectorAll(ALL_TIME_BUTTON_SELECTOR));
    const dateButton = dateButtons.find(btn => btn.querySelector(ALL_TIME_BUTTON_TEXT_SELECTOR)); // Find the button containing the specific text element

    if (!dateButton) {
        sendStatus('Помилка: Не знайдено кнопку фільтра дати.', 'error');
        return false;
    }

    const buttonTextElement = dateButton.querySelector(ALL_TIME_BUTTON_TEXT_SELECTOR);
    const currentText = buttonTextElement ? buttonTextElement.textContent.trim() : '';

    if (currentText === ALL_TIME_TEXT) {
      sendStatus('Фільтр "За весь час" вже встановлено.', 'success');
      return true;
    }

    sendStatus(`Поточний фільтр: "${currentText}". Встановлюємо "${ALL_TIME_TEXT}"...`);
    dateButton.click();

    // Wait for the menu to appear (often in a Popper or similar container)
    // Need a more robust way than just waiting for the ul by id
    const menuPopup = await waitForElement('.MuiPopover-paper, .MuiMenu-paper', document.body); // Wait for the popup paper element
    if (!menuPopup) {
        sendStatus('Помилка: Меню вибору періоду не з\'явилося.', 'error');
        return false;
    }
    await delay(200); // Extra small delay for menu items to render

    // Find the "За весь час" item within the visible menu
    const menuItems = Array.from(menuPopup.querySelectorAll(ALL_TIME_MENU_ITEM_SELECTOR));
    const allTimeMenuItem = menuItems.find(item => item.textContent.trim() === ALL_TIME_TEXT);


    if (!allTimeMenuItem) {
      sendStatus(`Помилка: Не знайдено пункт "${ALL_TIME_TEXT}" у меню.`, 'error');
       // Attempt to close the menu if possible
      const backdrop = document.querySelector('.MuiBackdrop-root');
      if (backdrop) backdrop.click();
      return false;
    }

    // Click the parent list item (li)
     const listItem = allTimeMenuItem.closest('li.MuiMenuItem-root');
     if (listItem) {
        listItem.click();
        sendStatus(`Пункт "${ALL_TIME_TEXT}" натиснуто.`);
        await delay(500); // Wait for the change to apply

        // Verify the change
        const updatedButtonTextElement = dateButton.querySelector(ALL_TIME_BUTTON_TEXT_SELECTOR);
        const updatedText = updatedButtonTextElement ? updatedButtonTextElement.textContent.trim() : '';
        if (updatedText === ALL_TIME_TEXT) {
            sendStatus('Фільтр "За весь час" успішно встановлено.', 'success');
            return true;
        } else {
             sendStatus(`Помилка: Текст кнопки не оновився після кліку (залишився "${updatedText}").`, 'error');
             return false;
        }
     } else {
         sendStatus(`Помилка: Не знайдено батьківський елемент 'li' для "${ALL_TIME_TEXT}".`, 'error');
         return false;
     }


  } catch (error) {
    sendStatus(`Помилка на кроці 1: ${error.message}`, 'error');
    console.error("Деталі помилки Кроку 1:", error);
    return false;
  }
}

/**
 * Scrolls through the transaction list, analyzes, and highlights entries.
 * Sends the final report back via sendStatus.
 * @param {'today'|'yesterday'|'custom'} periodType Type of period selected.
 * @param {string} startDate YYYY-MM-DD start date for 'custom'.
 * @param {string} endDate YYYY-MM-DD end date for 'custom'.
 * @param {boolean} findCashWithdrawals Whether to find cash withdrawals.
 * @param {string} cashWithdrawalText Text to search for in comments.
 */
// Modified scrollAndProcessTransactions function with improved stop logic

async function scrollAndProcessTransactions(periodType, startDate, endDate, findCashWithdrawals, cashWithdrawalText) {
  injectModalStyles();
  sendStatus('Крок 2: Початок прокрутки та аналізу транзакцій...');
  clearAllHighlights(); // Clear previous highlights

  const scrollContainer = await waitForElement(TRANSACTION_LIST_SELECTOR);
  if (!scrollContainer) {
      sendStatus('Помилка: Не знайдено контейнер списку транзакцій.', 'error', true);
      return;
  }

  // --- Determine Date Range ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  let targetStartDate, targetEndDate, stopScrollingDate;

  try {
      if (periodType === 'today') {
          targetStartDate = new Date(today);
          targetEndDate = new Date(today);
          stopScrollingDate = new Date(yesterday); // Stop when we see yesterday's date
          sendStatus(`Цільовий період: Сьогодні (${formatDate(targetStartDate)})`);
          sendStatus(`Прокрутка до появи дати: ${formatDate(stopScrollingDate)}`);
      } else if (periodType === 'yesterday') {
          targetStartDate = new Date(yesterday);
          targetEndDate = new Date(yesterday);
          const dayBeforeYesterday = new Date(yesterday);
          dayBeforeYesterday.setDate(yesterday.getDate() - 1);
          stopScrollingDate = new Date(dayBeforeYesterday); // Stop when we see day before yesterday
          sendStatus(`Цільовий період: Вчора (${formatDate(targetStartDate)})`);
          sendStatus(`Прокрутка до появи дати: ${formatDate(stopScrollingDate)}`);
      } else { // custom
          if (!startDate || !endDate) {
               sendStatus('Помилка: Для користувацького періоду не вказано дат.', 'error', true);
               return;
          }
          targetStartDate = new Date(startDate + 'T00:00:00');
          targetEndDate = new Date(endDate + 'T00:00:00');
          targetStartDate.setHours(0,0,0,0);
          targetEndDate.setHours(0,0,0,0);

          if (isNaN(targetStartDate) || isNaN(targetEndDate)) {
              sendStatus('Помилка: Недійсний формат дат для користувацького періоду.', 'error', true);
              return;
          }
          
          // Set stopScrollingDate to the day before the start date
          stopScrollingDate = new Date(targetStartDate);
          stopScrollingDate.setDate(targetStartDate.getDate() - 1);
          sendStatus(`Цільовий період: ${formatDate(targetStartDate)} - ${formatDate(targetEndDate)}`);
          sendStatus(`Прокрутка до появи дати: ${formatDate(stopScrollingDate)}`);
      }
  } catch (e) {
       sendStatus(`Помилка визначення періоду: ${e.message}`, 'error', true);
       console.error("Date parsing error:", e);
       return;
  }

  let processedRowIndexes = new Set();
  let matchedTransactions = []; // Array to hold unique matched transactions
  let lastScrollTop = -1;
  let reachedStopDate = false;
  let inactivityCounter = 0;
  const MAX_INACTIVITY = 5;
  
  // Add tracking variables to help debug
  let debugDatesFound = [];
  let debugOldestDate = null;

  while (!reachedStopDate && inactivityCounter < MAX_INACTIVITY) {
      const currentScrollTop = scrollContainer.scrollTop;
      
      if (inactivityCounter === 0 && processedRowIndexes.size % 10 < 2) {
           sendStatus(`Прокрутка: позиція ${currentScrollTop}, оброблено ~${processedRowIndexes.size} рядків.`);
      }

      const rows = scrollContainer.querySelectorAll(TRANSACTION_ROW_SELECTOR);
      let foundNewRows = false;
      let currentOldestVisibleDate = null;

      for (const row of rows) {
          const rowIndex = row.style.top;
          if (!rowIndex || processedRowIndexes.has(rowIndex)) {
              continue;
          }
          processedRowIndexes.add(rowIndex); // Mark as processed immediately
          foundNewRows = true;

          // --- Analyze Row ---
          const dateElement = row.querySelector(DATE_SELECTOR);
          const amountElement = row.querySelector(AMOUNT_SELECTOR);
          const commentElement = row.querySelector(COMMENT_SELECTOR);

          if (!dateElement || !amountElement) continue;

          const dateStr = dateElement.textContent.trim();
          const transactionDate = parseDateUA(dateStr);

          if (!transactionDate) continue;
          
          // Add to debug dates collection
          debugDatesFound.push({
              str: dateStr,
              date: formatDate(transactionDate)
          });

          // Track oldest date we've found
          if (!currentOldestVisibleDate || transactionDate < currentOldestVisibleDate) {
              currentOldestVisibleDate = transactionDate;
              debugOldestDate = {
                  str: dateStr,
                  date: formatDate(transactionDate)
              };
          }

          // --- Highlighting & Matching Logic ---
          let highlightType = null;
          const isWithinPeriod = transactionDate >= targetStartDate && transactionDate <= targetEndDate;

          if (isWithinPeriod) {
              highlightType = 'period';

              if (findCashWithdrawals && cashWithdrawalText) {
                  const amountStr = amountElement.textContent.replace(/\s|₴/g, '').replace(',', '.');
                  const amount = parseFloat(amountStr);
                  const commentStr = commentElement ? commentElement.textContent.trim() : '';

                  if (amount < 0 && commentStr.toLowerCase().includes(cashWithdrawalText.toLowerCase())) {
                      highlightType = 'match';
                      const transactionData = {
                          date: formatDate(transactionDate),
                          time: dateElement.nextElementSibling ? dateElement.nextElementSibling.textContent.trim() : 'N/A',
                          amount: amount,
                          comment: commentStr,
                          rawDateStr: dateStr,
                      };

                      const isDuplicate = matchedTransactions.some(existingTx =>
                          existingTx.date === transactionData.date &&
                          existingTx.amount === transactionData.amount &&
                          existingTx.comment === transactionData.comment
                      );

                      if (!isDuplicate) {
                          matchedTransactions.push(transactionData);
                      }
                  }
              }
          }
          highlightRow(row, highlightType);
      } // End row processing loop

      // --- Enhanced Debug Logging for Oldest Date ---
      if (currentOldestVisibleDate) {
          // Log more detailed information about the dates we're comparing
          console.log(`Current oldest visible date: ${formatDate(currentOldestVisibleDate)}, Stop date: ${formatDate(stopScrollingDate)}`);
          console.log(`Comparison result: ${currentOldestVisibleDate <= stopScrollingDate}`);
          
          // Check both date and time components
          console.log(`Date components - Oldest: ${currentOldestVisibleDate.getFullYear()}-${currentOldestVisibleDate.getMonth()}-${currentOldestVisibleDate.getDate()}`);
          console.log(`Date components - Stop: ${stopScrollingDate.getFullYear()}-${stopScrollingDate.getMonth()}-${stopScrollingDate.getDate()}`);
      }

      // --- FIXED: Improved Stop Condition ---
      if (currentOldestVisibleDate && currentOldestVisibleDate <= stopScrollingDate) {
          // Another safeguard: check if the dates are actually different when formatted
          const oldestDateFormatted = formatDate(currentOldestVisibleDate);
          const stopDateFormatted = formatDate(stopScrollingDate);
          
          if (oldestDateFormatted <= stopDateFormatted) {
              reachedStopDate = true;
              sendStatus(`Досягнуто цільової дати зупинки (найстаріша видима дата: ${oldestDateFormatted}, цільова дата зупинки: ${stopDateFormatted}), зупинка прокрутки.`, 'success');
              break;
          } else {
              sendStatus(`Дати порівнюються нерівно: ${oldestDateFormatted} vs ${stopDateFormatted}. Продовжуємо прокрутку.`, 'warning');
          }
      }

      // --- Scroll Down ---
      lastScrollTop = currentScrollTop;
      scrollContainer.scrollTop += SCROLL_STEP;

      // --- Wait After Scrolling ---
      await delay(SCROLL_DELAY);

      // --- Check for Inactivity / Reaching Bottom ---
      const newScrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight;
      const reachedBottom = (scrollHeight > 0) && (newScrollTop + scrollContainer.clientHeight >= scrollHeight - 20);

      if (newScrollTop === lastScrollTop) {
           if (!foundNewRows) {
               inactivityCounter++;
               sendStatus(`Прокрутка не змінила позицію та нових рядків не знайдено (${inactivityCounter}/${MAX_INACTIVITY})...`);
               
               // Enhanced debugging - if we're stuck, report what dates we found
               if (inactivityCounter === 3) {
                   console.log("DEBUG: Last dates found:", debugDatesFound.slice(-5));
                   console.log("DEBUG: Oldest date found:", debugOldestDate);
               }
           } else {
               inactivityCounter = 0;
           }
      } else if (reachedBottom) {
           sendStatus('Досягнуто кінця списку транзакцій.', 'success');
           break;
      } else {
           inactivityCounter = 0;
      }
      
      // Force break if we've processed too many rows (emergency exit)
      if (processedRowIndexes.size > 1000) {
          sendStatus('Досягнуто максимальної кількості оброблених рядків (1000+). Зупинка для уникнення зависання.', 'warning');
          break;
      }
  } // End while loop

  // --- Final Report ---
  sendStatus('Крок 3: Завершення аналізу та надсилання звіту...', 'pending');

  // Prepare report data to send back
  
  sendStatus('Крок 3: Завершення аналізу та надсилання звіту...', 'pending');

  // Prepare report data to send back
  const reportData = {
      count: matchedTransactions.length,
      totalAmount: matchedTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      transactions: matchedTransactions // Include the actual list
  };
  
  // Підготовка інформації про період для відображення в модальному вікні
  let periodInfo = '';
  if (periodType === 'today') {
      periodInfo = `Сьогодні (${formatDate(targetStartDate)})`;
  } else if (periodType === 'yesterday') {
      periodInfo = `Вчора (${formatDate(targetStartDate)})`;
  } else {
      periodInfo = `${formatDate(targetStartDate)} - ${formatDate(targetEndDate)}`;
  }
  
  // Показуємо модальне вікно з результатами
  showResultsModal(reportData, periodInfo);
  
  if (reportData.count > 0) {
      const summary = `Знайдено ${reportData.count} транзакцій зняття готівки. Загальна сума: ${reportData.totalAmount.toFixed(2)} ₴.`;
      // Send final success status WITH report data and done:true
      sendStatus(summary, 'success', true, reportData); // Add reportData here
      console.log("--- Фінальний Звіт (також надіслано в розширення) ---");
      console.table(reportData.transactions);
      console.log(`Загальна сума: ${reportData.totalAmount.toFixed(2)} ₴`);
      console.log("--------------------------------------------------");
  } else if (findCashWithdrawals) {
      // Send final warning status with empty report data and done:true
      sendStatus('Транзакцій зняття готівки за вказаними критеріями не знайдено.', 'warning', true, reportData);
  } else {
      // Send final success status with empty report data (as none were searched for) and done:true
      sendStatus('Аналіз періоду завершено (без пошуку зняття готівки).', 'success', true, reportData);
  }
}

// --- Event Listener for messages from popup ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Отримано повідомлення:', request); // Log received message

  if (request.action === "selectAllTime") {
    sendStatus('Отримано запит на встановлення "За весь час"...', 'pending');
    ensureAllTimeSelected()
      .then(success => {
        sendStatus('Операція "selectAllTime" завершена.', success ? 'success' : 'error', true); // Signal completion
        sendResponse({ status: success ? 'completed' : 'failed' });
      })
      .catch(error => {
        sendStatus(`Критична помилка в ensureAllTimeSelected: ${error.message}`, 'error', true);
        console.error(error);
        sendResponse({ status: 'failed', error: error.message });
      });
    return true; // Indicates asynchronous response
  }

   if (request.action === "filterByDate") {
    sendStatus('Отримано запит на фільтрацію за датою...', 'pending');
    // Ensure "За весь час" is set *before* starting the scroll/filter
    ensureAllTimeSelected().then(allTimeSuccess => {
        if (allTimeSuccess) {
            sendStatus('Передумова "За весь час" виконана, починаємо фільтрацію...');
            scrollAndProcessTransactions(
                request.periodType,
                request.startDate,
                request.endDate,
                request.findCashWithdrawals,
                request.cashWithdrawalText
            )
            .then(() => {
                // Status is sent within scrollAndProcessTransactions at the end
                sendResponse({ status: 'started_filtering' }); // Respond that filtering started
            })
             .catch(error => {
                sendStatus(`Критична помилка в scrollAndProcessTransactions: ${error.message}`, 'error', true);
                console.error(error);
                sendResponse({ status: 'failed_filtering', error: error.message });
            });
        } else {
            sendStatus('Не вдалося встановити "За весь час", фільтрацію скасовано.', 'error', true);
            sendResponse({ status: 'failed_prerequisite' });
        }
    }).catch(error => {
         sendStatus(`Критична помилка перевірки "За весь час": ${error.message}`, 'error', true);
         console.error(error);
         sendResponse({ status: 'failed_prerequisite', error: error.message });
    });


    return true; // Indicates asynchronous response
  }

  // Handle other potential actions if needed
  return false; // Indicates synchronous response or no handler
});

sendStatus("Content script завантажено та готовий до роботи.");