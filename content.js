// content.js
console.log("Finmap Bot Extension loaded");

// Function to wait for specified milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// Функція для створення та відображення таблиці знайдених транзакцій
function showCashWithdrawalTable(transactions, total, searchText) {
  // Перевіряємо, чи є що показувати
  if (!transactions || transactions.length === 0) return;
  
  // Спочатку прибираємо стару таблицю, якщо вона є
  const oldTable = document.getElementById('finmap-cash-withdrawal-table-container');
  if (oldTable) {
    oldTable.remove();
  }
  
  // Створюємо контейнер для таблиці
  const tableContainer = document.createElement('div');
  tableContainer.id = 'finmap-cash-withdrawal-table-container';
  tableContainer.style.position = 'fixed';
  tableContainer.style.top = '50%';
  tableContainer.style.left = '50%';
  tableContainer.style.transform = 'translate(-50%, -50%)';
  tableContainer.style.backgroundColor = 'white';
  tableContainer.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.3)';
  tableContainer.style.borderRadius = '8px';
  tableContainer.style.padding = '20px';
  tableContainer.style.zIndex = '10000';
  tableContainer.style.maxWidth = '90%';
  tableContainer.style.maxHeight = '80%';
  tableContainer.style.overflow = 'auto';
  tableContainer.style.fontFamily = 'Arial, sans-serif';
  
  // Заголовок таблиці
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '15px';
  header.style.borderBottom = '1px solid #ddd';
  header.style.paddingBottom = '10px';
  
  // Текст заголовка
  const title = document.createElement('h2');
  title.textContent = 'Знайдені транзакції зняття готівки';
  title.style.margin = '0';
  title.style.fontSize = '18px';
  title.style.color = '#333';
  
  // Кнопка закриття
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '✕';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.fontSize = '20px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.color = '#666';
  closeButton.onclick = function() {
    tableContainer.remove();
  };
  
  // Додаємо елементи заголовка
  header.appendChild(title);
  header.appendChild(closeButton);
  tableContainer.appendChild(header);
  
  // Інформація про пошук
  const searchInfo = document.createElement('div');
  searchInfo.style.marginBottom = '15px';
  searchInfo.style.fontSize = '14px';
  searchInfo.style.color = '#666';
  searchInfo.innerHTML = `
    <div>Пошуковий текст: <strong>${searchText}</strong></div>
    <div>Знайдено транзакцій: <strong>${transactions.length}</strong></div>
    <div>Загальна сума: <strong>${total.toFixed(2)} грн</strong></div>
  `;
  tableContainer.appendChild(searchInfo);
  
  // Створюємо таблицю
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '14px';
  
  // Заголовок таблиці
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; background-color: #f5f5f5;">№</th>
      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; background-color: #f5f5f5;">Дата</th>
      <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd; background-color: #f5f5f5;">Сума (грн)</th>
      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; background-color: #f5f5f5;">Коментар</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Тіло таблиці
  const tbody = document.createElement('tbody');
  
  // Додаємо рядки таблиці
  transactions.forEach((transaction, index) => {
    const row = document.createElement('tr');
    row.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f9f9f9';
    
    // Номер рядка
    const numCell = document.createElement('td');
    numCell.textContent = index + 1;
    numCell.style.padding = '8px 10px';
    numCell.style.borderBottom = '1px solid #ddd';
    
    // Дата
    const dateCell = document.createElement('td');
    dateCell.textContent = transaction.date || '-';
    dateCell.style.padding = '8px 10px';
    dateCell.style.borderBottom = '1px solid #ddd';
    
    // Сума
    const amountCell = document.createElement('td');
    amountCell.textContent = transaction.amount.toFixed(2);
    amountCell.style.padding = '8px 10px';
    amountCell.style.borderBottom = '1px solid #ddd';
    amountCell.style.textAlign = 'right';
    amountCell.style.fontWeight = 'bold';
    
    // Коментар
    const commentCell = document.createElement('td');
    commentCell.textContent = transaction.comment || '-';
    commentCell.style.padding = '8px 10px';
    commentCell.style.borderBottom = '1px solid #ddd';
    commentCell.style.maxWidth = '400px';
    commentCell.style.overflow = 'hidden';
    commentCell.style.textOverflow = 'ellipsis';
    commentCell.style.whiteSpace = 'nowrap';
    commentCell.title = transaction.comment; // Повний текст у тултіпі
    
    // Додаємо комірки до рядка
    row.appendChild(numCell);
    row.appendChild(dateCell);
    row.appendChild(amountCell);
    row.appendChild(commentCell);
    
    // Додаємо рядок до тіла таблиці
    tbody.appendChild(row);
    
    // Додаємо можливість натискати на рядок для прокрутки до транзакції
    if (transaction.element) {
      row.style.cursor = 'pointer';
      row.title = 'Натисніть, щоб перейти до транзакції';
      row.onclick = function() {
        // Прокручуємо до елемента
        transaction.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Додаємо ефект мигання для підсвічування
        transaction.element.style.transition = 'background-color 0.3s';
        const originalBackground = transaction.element.style.backgroundColor;
        transaction.element.style.backgroundColor = 'rgba(255, 193, 7, 0.8)';
        
        // Повертаємо оригінальний колір
        setTimeout(() => {
          transaction.element.style.backgroundColor = originalBackground;
        }, 1000);
      };
    }
  });
  
  table.appendChild(tbody);
  
  // Додаємо підсумковий рядок
  const tfoot = document.createElement('tfoot');
  tfoot.innerHTML = `
    <tr>
      <td colspan="2" style="padding: 10px; font-weight: bold; border-top: 2px solid #ddd; text-align: right;">Загалом:</td>
      <td style="padding: 10px; font-weight: bold; border-top: 2px solid #ddd; text-align: right;">${total.toFixed(2)}</td>
      <td style="padding: 10px; border-top: 2px solid #ddd;"></td>
    </tr>
  `;
  table.appendChild(tfoot);
  
  // Додаємо таблицю до контейнера
  tableContainer.appendChild(table);
  
  // Додаємо кнопки дій внизу
  const actionsContainer = document.createElement('div');
  actionsContainer.style.marginTop = '15px';
  actionsContainer.style.display = 'flex';
  actionsContainer.style.justifyContent = 'space-between';
  
  // Кнопка "Закрити"
  const closeBtnBottom = document.createElement('button');
  closeBtnBottom.textContent = 'Закрити';
  closeBtnBottom.style.padding = '8px 15px';
  closeBtnBottom.style.backgroundColor = '#e0e0e0';
  closeBtnBottom.style.border = 'none';
  closeBtnBottom.style.borderRadius = '4px';
  closeBtnBottom.style.cursor = 'pointer';
  closeBtnBottom.onclick = function() {
    tableContainer.remove();
  };
  
  // Кнопка "Копіювати дані"
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Копіювати дані';
  copyBtn.style.padding = '8px 15px';
  copyBtn.style.backgroundColor = '#00B28E';
  copyBtn.style.color = 'white';
  copyBtn.style.border = 'none';
  copyBtn.style.borderRadius = '4px';
  copyBtn.style.cursor = 'pointer';
  copyBtn.onclick = function() {
    let clipboardText = 'Транзакції зняття готівки:\n\n';
    clipboardText += `Пошуковий текст: ${searchText}\n`;
    clipboardText += `Знайдено транзакцій: ${transactions.length}\n`;
    clipboardText += `Загальна сума: ${total.toFixed(2)} грн\n\n`;
    
    clipboardText += 'Дата\tСума\tКоментар\n';
    transactions.forEach(t => {
      clipboardText += `${t.date || '-'}\t${t.amount.toFixed(2)}\t${t.comment || '-'}\n`;
    });
    
    // Копіюємо текст у буфер обміну
    navigator.clipboard.writeText(clipboardText).then(
      function() {
        copyBtn.textContent = 'Скопійовано!';
        setTimeout(() => {
          copyBtn.textContent = 'Копіювати дані';
        }, 2000);
      },
      function(err) {
        console.error('Помилка копіювання: ', err);
        alert('Помилка копіювання даних. Спробуйте ще раз.');
      }
    );
  };
  
  // Додаємо кнопки
  actionsContainer.appendChild(closeBtnBottom);
  actionsContainer.appendChild(copyBtn);
  tableContainer.appendChild(actionsContainer);
  
  // Додаємо контейнер до документа
  document.body.appendChild(tableContainer);
}
// Додаємо цю функцію для відображення оновлюваної інформації під час прокрутки
function createScrollingInfoPanel() {
  // Перевіряємо, чи вже існує панель
  if (document.getElementById('finmap-scrolling-info')) {
    return document.getElementById('finmap-scrolling-info');
  }

  // Створюємо плаваючу панель з інформацією
  const infoPanel = document.createElement('div');
  infoPanel.id = 'finmap-scrolling-info';
  infoPanel.style.position = 'fixed';
  infoPanel.style.top = '10px';
  infoPanel.style.left = '10px';
  infoPanel.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  infoPanel.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
  infoPanel.style.borderRadius = '4px';
  infoPanel.style.padding = '10px';
  infoPanel.style.fontSize = '14px';
  infoPanel.style.zIndex = '9998';
  infoPanel.style.maxWidth = '400px';
  infoPanel.style.maxHeight = '400px';
  infoPanel.style.overflowY = 'auto';
  infoPanel.style.transition = 'opacity 0.3s';
  
  // Створюємо заголовок
  const header = document.createElement('div');
  header.style.fontWeight = 'bold';
  header.style.marginBottom = '5px';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.innerHTML = `
    <span>Знайдені транзакції зняття готівки:</span>
    <span id="finmap-withdrawal-count">(0)</span>
  `;
  
  // Створюємо загальну суму
  const totalSection = document.createElement('div');
  totalSection.style.marginBottom = '10px';
  totalSection.style.fontWeight = 'bold';
  totalSection.innerHTML = `Загальна сума: <span id="finmap-withdrawal-total">0.00</span> ₴`;
  
  // Створюємо контейнер для списку транзакцій
  const transactionsList = document.createElement('div');
  transactionsList.id = 'finmap-transactions-list';
  transactionsList.style.fontSize = '13px';
  
  // Додаємо кнопку закриття
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '✕';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '5px';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontSize = '16px';
  closeButton.style.color = '#777';
  closeButton.onclick = function() {
    infoPanel.style.opacity = '0';
    // Після затухання анімації видаляємо
    setTimeout(() => infoPanel.remove(), 300);
  };
  
  // Збираємо панель
  infoPanel.appendChild(closeButton);
  infoPanel.appendChild(header);
  infoPanel.appendChild(totalSection);
  infoPanel.appendChild(transactionsList);
  
  // Додаємо в документ
  document.body.appendChild(infoPanel);
  
  return infoPanel;
}

// Функція для оновлення інформації на панелі
function updateScrollingInfo(transactions, total) {
  const infoPanel = createScrollingInfoPanel();
  const transactionsList = document.getElementById('finmap-transactions-list');
  const countElement = document.getElementById('finmap-withdrawal-count');
  const totalElement = document.getElementById('finmap-withdrawal-total');
  
  // Оновлюємо лічильник
  countElement.textContent = `(${transactions.length})`;
  
  // Оновлюємо загальну суму
  totalElement.textContent = total.toFixed(2);
  
  // Оновлюємо список транзакцій
  transactionsList.innerHTML = '';
  
  // Додаємо останні 10 транзакцій (або всі, якщо їх менше 10)
  const recentTransactions = transactions.slice(-10).reverse();
  
  recentTransactions.forEach((transaction, index) => {
    const item = document.createElement('div');
    item.style.padding = '5px 0';
    item.style.borderBottom = index < recentTransactions.length - 1 ? '1px solid #eee' : 'none';
    
    // Форматуємо дату
    const dateStr = transaction.date ? `<span style="color:#666;">${transaction.date}</span> - ` : '';
    
    // Створюємо елемент транзакції
    item.innerHTML = `
      ${dateStr}
      <span style="font-weight:bold; color:#e74c3c;">${transaction.amount.toFixed(2)} ₴</span>
      <div style="font-size:12px; color:#666; margin-top:2px; text-overflow:ellipsis; overflow:hidden;">${transaction.comment}</div>
    `;
    
    transactionsList.appendChild(item);
  });
}
// Function to check if element exists
async function waitForElement(selector, timeout = 5000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await sleep(100);
  }
  
  return null;
}

// Function to send status back to popup
function sendStatus(text, status, done = false) {
  chrome.runtime.sendMessage({
    type: 'status',
    text: text,
    status: status,
    done: done
  });
  console.log(`Status: ${text} (${status})`);
}

// Function to find the period button specifically
function findPeriodButton() {
  // Метод 1: Знайти за текстом "За весь час" або текстом, що закінчується на "час"
  const allButtons = Array.from(document.querySelectorAll('button'));
  console.log(`Found ${allButtons.length} buttons on the page`);
  
  // Log all buttons text for debugging
  allButtons.forEach((btn, index) => {
    console.log(`Button ${index}: ${btn.textContent.trim()}`);
  });
  
  // First, try to find a button with "За весь час" exactly
  const exactMatchButton = allButtons.find(btn => 
    btn.textContent.includes('За весь час') && 
    !btn.textContent.includes('Дохід')
  );
  
  if (exactMatchButton) {
    console.log("Found exact match button with 'За весь час'");
    return exactMatchButton;
  }
  
  // If not found, look for buttons with SVG path that has "7 10l5 5 5-5z" (dropdown arrow)
  const dropdownButtons = allButtons.filter(btn => {
    const svgPath = btn.querySelector('svg path');
    return svgPath && svgPath.getAttribute('d') === 'M7 10l5 5 5-5z';
  });
  
  console.log(`Found ${dropdownButtons.length} buttons with dropdown arrows`);
  
  // If we found multiple dropdown buttons, pick one that doesn't contain "Дохід"
  const periodButton = dropdownButtons.find(btn => !btn.textContent.includes('Дохід'));
  
  if (periodButton) {
    console.log("Found period button with dropdown arrow");
    return periodButton;
  }
  
  // As a last resort, try to find any button with paragraph element inside
  const buttonsWithP = allButtons.filter(btn => {
    const paragraph = btn.querySelector('p');
    return paragraph && !btn.textContent.includes('Дохід');
  });
  
  console.log(`Found ${buttonsWithP.length} buttons with paragraph elements`);
  
  if (buttonsWithP.length > 0) {
    // Take the first one that doesn't say "Дохід"
    return buttonsWithP[0];
  }
  
  // If all else fails, return null
  return null;
}

// Main function to select "За весь час"
async function selectAllTime() {
  try {
    sendStatus('Пошук кнопки періоду...', 'pending');
    
    // Use our custom function to find the period button
    const periodButton = findPeriodButton();
    
    if (!periodButton) {
      sendStatus('Помилка: Кнопка періоду не знайдена', 'error');
      return;
    }
    
    sendStatus(`Кнопка періоду знайдена: "${periodButton.textContent.trim()}"`, 'success');
    
    // Check if "За весь час" is already selected
    if (periodButton.textContent.includes('За весь час')) {
      sendStatus('Період "За весь час" вже вибрано', 'success', true);
      return;
    }
    
    // Click on the period button to open dropdown
    sendStatus('Відкриваю випадаюче меню...', 'pending');
    console.log('Clicking period button:', periodButton);
    periodButton.click();
    await sleep(1000);
    
    // Now look for all dropdown menu items
    const menuItems = document.querySelectorAll('li.MuiButtonBase-root');
    console.log(`Found ${menuItems.length} menu items`);
    
    // Log all menu items for debugging
    Array.from(menuItems).forEach((item, index) => {
      console.log(`Menu item ${index}: ${item.textContent.trim()}`);
    });
    
    // Find the "За весь час" option
    const allTimeOption = Array.from(menuItems).find(item => 
      item.textContent.includes('За весь час')
    );
    
    if (!allTimeOption) {
      sendStatus('Помилка: Опція "За весь час" не знайдена', 'error');
      return;
    }
    
    sendStatus('Опція "За весь час" знайдена', 'success');
    
    // Click on the "За весь час" option
    console.log('Clicking on "За весь час" option:', allTimeOption);
    allTimeOption.click();
    await sleep(1000);
    
    // Verify selection was successful
    const updatedPeriodButton = findPeriodButton();
    
    if (updatedPeriodButton && updatedPeriodButton.textContent.includes('За весь час')) {
      sendStatus('Період "За весь час" успішно вибрано', 'success', true);
    } else {
      sendStatus('Помилка: Не вдалося перевірити вибір періоду', 'error');
    }
    
  } catch (error) {
    console.error("Error in selectAllTime:", error);
    sendStatus(`Помилка: ${error.message}`, 'error');
  }
}

// Функція для перетворення строки дати ("31 бер 2025") у об'єкт Date
function parseFinmapDate(dateStr) {
  // Створюємо таблицю для перетворення українських скорочень місяців
  const monthMap = {
    'січ': 0, // Січень (January)
    'лют': 1, // Лютий (February)
    'бер': 2, // Березень (March)
    'кві': 3, // Квітень (April)
    'тра': 4, // Травень (May)
    'чер': 5, // Червень (June)
    'лип': 6, // Липень (July)
    'сер': 7, // Серпень (August)
    'вер': 8, // Вересень (September)
    'жов': 9, // Жовтень (October)
    'лис': 10, // Листопад (November)
    'гру': 11  // Грудень (December)
  };

  // Розбиваємо строку на частини
  const parts = dateStr.trim().split(' ');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const monthStr = parts[1].toLowerCase();
  const year = parseInt(parts[2], 10);

  // Перевіряємо, чи місяць є в нашій таблиці
  if (!(monthStr in monthMap)) return null;
  const month = monthMap[monthStr];

  // Створюємо об'єкт Date
  return new Date(year, month, day);
}

// Функція для перевірки, чи дата входить у заданий діапазон
function isDateInRange(dateToCheck, startDate, endDate) {
  // Якщо дати не задані, всі дати проходять
  if (!startDate && !endDate) return true;
  
  // Парсимо дату транзакції
  const transactionDate = parseFinmapDate(dateToCheck);
  if (!transactionDate) return false;
  
  // Вирівнюємо час до початку дня для коректного порівняння
  const checkDate = new Date(transactionDate.setHours(0, 0, 0, 0));
  
  // Перевіряємо входження у діапазон
  const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
  const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;
  
  if (start && end) {
    return checkDate >= start && checkDate <= end;
  } else if (start) {
    return checkDate >= start;
  } else if (end) {
    return checkDate <= end;
  }
  
  return true;
}

// Функція для отримання вчорашньої дати
function getYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

// Функція для фільтрації та прокрутки списку за датою
// Функція для фільтрації та прокрутки списку за датою,
// а також пошуку транзакцій зняття готівки
// Функція для фільтрації та прокрутки списку за датою,
// а також пошуку транзакцій зняття готівки
// Функція для фільтрації та прокрутки списку за датою,
// а також пошуку транзакцій зняття готівки
// Функція для виділення підрядка в тексті
function highlightSubstring(originalElement, searchText) {
  // Отримуємо оригінальний текст
  const originalText = originalElement.textContent;
  
  // Якщо підрядок не знайдено, повертаємо
  if (!originalText.includes(searchText)) return;
  
  // Створюємо новий вміст з виділенням
  const startIndex = originalText.indexOf(searchText);
  const endIndex = startIndex + searchText.length;
  
  const beforeText = originalText.substring(0, startIndex);
  const matchText = originalText.substring(startIndex, endIndex);
  const afterText = originalText.substring(endIndex);
  
  // Заміняємо текст на HTML з виділенням
  originalElement.innerHTML = `
    ${beforeText}<span style="background-color: #FFC107; color: #e74c3c; font-weight: bold; padding: 0 2px; border-radius: 2px;">${matchText}</span>${afterText}
  `;
}

// Оновлена функція фільтрації
async function filterByDate(periodType, startDate, endDate, cashWithdrawalText = "Зняття готівки: Банкомат") {
  try {
    sendStatus('Початок фільтрації за датою та пошуку зняття готівки...', 'pending');
    
    // Встановлюємо дати на основі типу періоду
    let filterStartDate = null;
    let filterEndDate = null;
    
    if (periodType === 'yesterday') {
      const yesterday = getYesterday();
      filterStartDate = yesterday;
      filterEndDate = yesterday;
      sendStatus(`Фільтрація за вчорашнім днем: ${yesterday.toLocaleDateString('uk-UA')}`, 'pending');
    } else if (periodType === 'custom') {
      filterStartDate = startDate ? new Date(startDate) : null;
      filterEndDate = endDate ? new Date(endDate) : null;
      sendStatus(`Фільтрація за період: ${filterStartDate?.toLocaleDateString('uk-UA') || 'початок'} - ${filterEndDate?.toLocaleDateString('uk-UA') || 'кінець'}`, 'pending');
    }
    
    // Завантажуємо всі транзакції, прокручуючи до кінця списку кілька разів
    await loadAllTransactions();
    
    // Знаходимо всі видимі транзакції
    const rows = document.querySelectorAll('.cypress-log-row');
    if (rows.length === 0) {
      sendStatus('Помилка: Записи транзакцій не знайдено', 'error');
      return;
    }
    
    sendStatus(`Знайдено ${rows.length} транзакцій в поточному відображенні`, 'success');
    
    // Додаємо стиль для підсвічування до документа, якщо його ще немає
    if (!document.getElementById('finmap-bot-highlight-style')) {
      const style = document.createElement('style');
      style.id = 'finmap-bot-highlight-style';
      style.textContent = `
        .finmap-bot-highlight {
          background-color: rgba(0, 178, 142, 0.2) !important;
          border: 2px solid #00B28E !important;
          transition: background-color 0.3s ease;
        }
        .finmap-bot-out-of-range {
          border-top: 4px dashed #e74c3c !important;
        }
        .finmap-cash-withdrawal {
          background-color: rgba(255, 193, 7, 0.3) !important;
          border: 2px solid #FFC107 !important;
        }
        .finmap-info-badge {
          display: inline-block;
          background-color: #3498db;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 8px;
          vertical-align: middle;
        }
        .finmap-highlight-amount {
          font-weight: bold !important;
          color: #e74c3c !important;
          background-color: yellow !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Прокручуємо до першої знайденої транзакції
    const scrollContainer = document.querySelector('.ReactVirtualized__Grid');
    if (!scrollContainer) {
      sendStatus('Помилка: Не вдалося знайти контейнер для прокрутки', 'error');
      return;
    }
    
    // Використовуємо альтернативний метод для прокрутки до елемента в віртуалізованому списку
    let scrollInterval;
    let scrollAttempts = 0;
    const maxScrollAttempts = 100; // Збільшуємо кількість спроб
    let foundFirstMatch = false;
    
    // Лічильники для зняття готівки
    let cashWithdrawalCount = 0;
    let cashWithdrawalTotal = 0;
    
    // Функція для скасування автоматичної прокрутки
    function stopScrolling() {
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    }
    
    // Додаємо кнопку для зупинки прокрутки
    const stopButton = document.createElement('button');
    stopButton.textContent = 'Зупинити пошук';
    stopButton.style.position = 'fixed';
    stopButton.style.top = '10px';
    stopButton.style.right = '10px';
    stopButton.style.zIndex = '9999';
    stopButton.style.backgroundColor = '#e74c3c';
    stopButton.style.color = 'white';
    stopButton.style.padding = '5px 10px';
    stopButton.style.border = 'none';
    stopButton.style.borderRadius = '4px';
    stopButton.style.cursor = 'pointer';
    
    stopButton.addEventListener('click', () => {
      stopScrolling();
      document.body.removeChild(stopButton);
      sendStatus('Пошук зупинено користувачем', 'warning', true);
      
      // Показуємо інформацію про зняття готівки навіть при зупинці
      if (cashWithdrawalCount > 0) {
        showCashWithdrawalInfo(cashWithdrawalCount, cashWithdrawalTotal, cashWithdrawalText);
      }
    });
    
    document.body.appendChild(stopButton);
    
    // Швидко прокручуємо вгору, щоб почати пошук з початку списку
    scrollContainer.scrollTo({ top: 0, behavior: 'auto' });
    await sleep(500);
    
    // Лічильник знайдених транзакцій
    let matchCount = 0;
    let lastMatchDate = null;
    let foundOutOfRangeDate = false;
    
    // Функція для пошуку та підсвічування транзакцій
    function findAndHighlightTransactions() {
      // Оновлюємо список видимих рядків
      const visibleRows = document.querySelectorAll('.cypress-log-row');
      let currentRowsFound = 0;
      let outOfRangeFound = false;
      
      // Для кожного рядка
      for (const row of visibleRows) {
        // 1. Отримуємо дату (другий div)
        const dateContainer = row.querySelector('div:nth-child(2)');
        let dateText = '';
        
        if (dateContainer) {
          // Шукаємо дату в першому параграфі
          const dateParagraph = dateContainer.querySelector('p:first-child');
          if (dateParagraph) {
            dateText = dateParagraph.textContent.trim();
          }
        }
        
        if (!dateText || !/^\d{1,2}\s+[а-яіїє]{3}\s+\d{4}$/i.test(dateText)) continue;
        
        // Парсимо дату для перевірки
        const rowDate = parseFinmapDate(dateText);
        if (!rowDate) continue;
        
        // Перевіряємо, чи дата входить у діапазон
        const inRange = isDateInRange(dateText, filterStartDate, filterEndDate);
        
        if (inRange) {
          // Підсвічуємо знайдений рядок
          row.classList.add('finmap-bot-highlight');
          currentRowsFound++;
          
          if (!foundFirstMatch) {
            foundFirstMatch = true;
            sendStatus(`Знайдено першу транзакцію за ${dateText}`, 'success');
            // Відмічаємо останню знайдену дату
            lastMatchDate = rowDate;
          }
          
          // 2. Перевіряємо, чи це витрата (від'ємна сума в третьому div)
          const amountContainer = row.querySelector('div:nth-child(3)');
          let isExpense = false;
          let amount = 0;
          let amountText = '';
          
          if (amountContainer) {
            // Шукаємо суму
            const amountParagraph = amountContainer.querySelector('p');
            if (amountParagraph) {
              amountText = amountParagraph.textContent.trim();
              // Перевіряємо, чи це від'ємна сума
              if (amountText.startsWith('-')) {
                isExpense = true;
                // Перетворюємо текст у числове значення, видаляючи пробіли, валюту і знак мінус
                amount = parseFloat(amountText.replace(/[^\d.,]/g, '').replace(',', '.')) * -1;
                
                // Підсвічуємо суму для всіх витрат
                amountParagraph.classList.add('finmap-highlight-amount');
              }
            }
          }
          
          // 3. Якщо це витрата, перевіряємо чи має коментар у будь-якому div
          if (isExpense && cashWithdrawalText) {
            // Шукаємо всі параграфи в рядку
            const allParagraphs = row.querySelectorAll('p');
            let foundWithdrawal = false;
            let commentText = '';
            let commentElement = null;
            
            // Перевіряємо всі параграфи на наявність тексту зняття готівки
            for (const paragraph of allParagraphs) {
              const text = paragraph.textContent.trim();
              
              // Якщо знайшли текст про зняття готівки
              if (text && text.includes(cashWithdrawalText)) {
                foundWithdrawal = true;
                commentText = text;
                commentElement = paragraph;
                break;
              }
            }
            
            // Перевіряємо явно 7-й div, який має містити коментар
            const commentContainer = row.querySelector('div:nth-child(7)');
            if (commentContainer && !foundWithdrawal) {
              const commentParagraph = commentContainer.querySelector('p');
              if (commentParagraph) {
                const text = commentParagraph.textContent.trim();
                if (text && text.includes(cashWithdrawalText)) {
                  foundWithdrawal = true;
                  commentText = text;
                  commentElement = commentParagraph;
                }
              }
            }
            
            // Якщо знайшли коментар зі зняттям готівки
            if (foundWithdrawal && commentElement) {
              // Додаємо специфічний клас для зняття готівки
              row.classList.add('finmap-cash-withdrawal');
              cashWithdrawalCount++;
              cashWithdrawalTotal += Math.abs(amount);
              
              // Виділяємо підрядок в коментарі
              highlightSubstring(commentElement, cashWithdrawalText);
              
              // Додаємо відзнаку "Готівка" поруч з амаунтом, якщо її ще немає
              if (amountContainer && !amountContainer.querySelector('.finmap-info-badge')) {
                const badge = document.createElement('span');
                badge.className = 'finmap-info-badge';
                badge.textContent = 'Готівка';
                amountContainer.appendChild(badge);
              }
              
              // Додаємо підказку з інформацією
              row.title = `Зняття готівки: ${Math.abs(amount).toFixed(2)} грн`;
              
              console.log(`Знайдено зняття готівки: ${commentText}, сума: ${Math.abs(amount)}`);
            }
          }
          
        } else if (foundFirstMatch) {
          // Якщо це дата, яка виходить за діапазон і ми вже знайшли першу відповідну транзакцію
          
          // Перевіряємо, чи ця дата старіша за останню знайдену в діапазоні
          // Коли ми рухаємось вниз списку, дати стають старішими
          if (lastMatchDate && rowDate < lastMatchDate) {
            row.classList.add('finmap-bot-out-of-range');
            outOfRangeFound = true;
            foundOutOfRangeDate = true;
            
            // Зупиняємо прокрутку, бо знайшли дату поза діапазоном
            stopScrolling();
            document.body.removeChild(stopButton);
            
            const message = `Знайдено ${matchCount} транзакцій за вказаний період, досягнуто кінця діапазону`;
            sendStatus(message, 'success', true);
            
            // Показуємо інформацію про зняття готівки
            if (cashWithdrawalCount > 0) {
              showCashWithdrawalInfo(cashWithdrawalCount, cashWithdrawalTotal, cashWithdrawalText);
            }
            
            break;
          }
        }
      }
      
      // Оновлюємо загальний лічильник знайдених транзакцій
      matchCount += currentRowsFound;
      
      // Якщо знайдено дати поза діапазоном, припиняємо пошук
      if (outOfRangeFound) {
        return;
      }
      
      // Якщо в поточному вікні знайдено транзакції в діапазоні, але не знайдено поза діапазоном, прокручуємо далі
      if (currentRowsFound > 0) {
        // Прокручуємо вниз до наступної порції транзакцій
        scrollContainer.scrollBy({ top: 300, behavior: 'smooth' });
        scrollAttempts = 0; // Скидаємо лічильник спроб, бо ми на правильному шляху
      } else {
        // Якщо в поточному вікні не знайдено транзакцій в діапазоні, перевіряємо, чи ми вже щось знайшли раніше
        if (foundFirstMatch) {
          // Якщо раніше знаходили, але зараз не знаходимо, і не знайшли дати поза діапазоном,
          // продовжуємо гортати, щоб знайти або більше потрібних транзакцій, або дати поза діапазоном
          scrollContainer.scrollBy({ top: 300, behavior: 'smooth' });
          scrollAttempts++;
        } else {
          // Якщо ще не знайшли жодної транзакції в діапазоні, продовжуємо шукати
          scrollContainer.scrollBy({ top: 300, behavior: 'smooth' });
          scrollAttempts++;
        }
        
        // Перевіряємо, чи не досягли ми ліміту спроб
        if (scrollAttempts >= maxScrollAttempts) {
          stopScrolling();
          document.body.removeChild(stopButton);
          
          if (matchCount > 0) {
            const message = `Знайдено ${matchCount} транзакцій за вказаний період, досягнуто кінця списку`;
            sendStatus(message, 'success', true);
            
            // Показуємо інформацію про зняття готівки
            if (cashWithdrawalCount > 0) {
              showCashWithdrawalInfo(cashWithdrawalCount, cashWithdrawalTotal, cashWithdrawalText);
            }
          } else {
            sendStatus('Транзакцій за вказаний період не знайдено', 'warning', true);
          }
          return;
        }
      }
      
      // Перевіряємо, чи змінилася позиція прокрутки
      const currentScrollTop = scrollContainer.scrollTop;
      setTimeout(() => {
        if (scrollInterval && scrollContainer.scrollTop === currentScrollTop) {
          // Якщо позиція не змінилася, можливо, ми досягли кінця списку
          stopScrolling();
          document.body.removeChild(stopButton);
          
          if (matchCount > 0) {
            const message = `Знайдено ${matchCount} транзакцій за вказаний період, досягнуто кінця списку`;
            sendStatus(message, 'success', true);
            
            // Показуємо інформацію про зняття готівки
            if (cashWithdrawalCount > 0) {
              showCashWithdrawalInfo(cashWithdrawalCount, cashWithdrawalTotal, cashWithdrawalText);
            }
          } else {
            sendStatus('Транзакцій за вказаний період не знайдено', 'warning', true);
          }
        }
      }, 500);
    }
    
    // Запускаємо інтервал для прокрутки та пошуку
    scrollInterval = setInterval(findAndHighlightTransactions, 1000);
    
    // Виконуємо перший пошук одразу
    findAndHighlightTransactions();
    
  } catch (error) {
    console.error("Error in filterByDate:", error);
    sendStatus(`Помилка фільтрації: ${error.message}`, 'error');
    
    // Прибираємо кнопку зупинки, якщо вона є
    const stopButton = document.querySelector('button[style*="position: fixed"]');
    if (stopButton) {
      document.body.removeChild(stopButton);
    }
  }
}

// Функція для відображення інформації про знайдені транзакції зняття готівки
function showCashWithdrawalInfo(count, total, searchText) {
  // Додатково відправляємо статус
  sendStatus(`Знайдено ${count} транзакцій зняття готівки на суму ${total.toFixed(2)}`, 'success');
  
  // Створюємо інформаційний блок
  const infoBlock = document.createElement('div');
  infoBlock.style.position = 'fixed';
  infoBlock.style.bottom = '20px';
  infoBlock.style.right = '20px';
  infoBlock.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  infoBlock.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
  infoBlock.style.padding = '15px';
  infoBlock.style.borderRadius = '5px';
  infoBlock.style.zIndex = '9999';
  infoBlock.style.maxWidth = '300px';
  infoBlock.style.fontSize = '14px';
  infoBlock.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">Зняття готівки:</div>
    <div>Знайдено транзакцій: <strong>${count}</strong></div>
    <div>Загальна сума: <strong>${total.toFixed(2)}</strong></div>
    <div style="margin-top: 10px; font-size: 12px; color: #666;">Пошуковий текст: "${searchText}"</div>
    <button id="closeInfoBlock" style="margin-top: 10px; padding: 5px 10px; background-color: #00B28E; color: white; border: none; border-radius: 3px; cursor: pointer;">Закрити</button>
  `;
  
  document.body.appendChild(infoBlock);
  
  // Додаємо обробник для кнопки закриття
  document.getElementById('closeInfoBlock').addEventListener('click', () => {
    document.body.removeChild(infoBlock);
  });
}

// Функція для відображення інформації про знайдені транзакції зняття готівки
function showCashWithdrawalInfo(count, total, searchText) {
  // Додатково відправляємо статус
  sendStatus(`Знайдено ${count} транзакцій зняття готівки на суму ${total.toFixed(2)}`, 'success');
  
  // Створюємо інформаційний блок
  const infoBlock = document.createElement('div');
  infoBlock.style.position = 'fixed';
  infoBlock.style.bottom = '20px';
  infoBlock.style.right = '20px';
  infoBlock.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  infoBlock.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
  infoBlock.style.padding = '15px';
  infoBlock.style.borderRadius = '5px';
  infoBlock.style.zIndex = '9999';
  infoBlock.style.maxWidth = '300px';
  infoBlock.style.fontSize = '14px';
  infoBlock.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">Зняття готівки:</div>
    <div>Знайдено транзакцій: <strong>${count}</strong></div>
    <div>Загальна сума: <strong>${total.toFixed(2)}</strong></div>
    <div style="margin-top: 10px; font-size: 12px; color: #666;">Пошуковий текст: "${searchText}"</div>
    <button id="closeInfoBlock" style="margin-top: 10px; padding: 5px 10px; background-color: #00B28E; color: white; border: none; border-radius: 3px; cursor: pointer;">Закрити</button>
  `;
  
  document.body.appendChild(infoBlock);
  
  // Додаємо обробник для кнопки закриття
  document.getElementById('closeInfoBlock').addEventListener('click', () => {
    document.body.removeChild(infoBlock);
  });
}

// Функція для завантаження всіх транзакцій шляхом прокрутки до кінця списку
async function loadAllTransactions() {
  try {
    sendStatus('Завантаження транзакцій...', 'pending');
    
    const scrollContainer = document.querySelector('.ReactVirtualized__Grid');
    if (!scrollContainer) {
      sendStatus('Помилка: Не вдалося знайти контейнер для прокрутки', 'error');
      return;
    }
    
    // Спочатку прокручуємо до початку списку
    scrollContainer.scrollTo({ top: 0, behavior: 'auto' });
    await sleep(500);
    
    // Запам'ятовуємо початкову кількість транзакцій
    let initialRowCount = document.querySelectorAll('.cypress-log-row').length;
    
    // Виконуємо кілька прокруток для завантаження додаткових транзакцій
    for (let i = 0; i < 3; i++) {
      // Прокручуємо вниз на великий крок
      scrollContainer.scrollBy({ top: 1000, behavior: 'auto' });
      await sleep(500);
      
      // Перевіряємо, чи завантажилися нові транзакції
      const currentRowCount = document.querySelectorAll('.cypress-log-row').length;
      if (currentRowCount > initialRowCount) {
        initialRowCount = currentRowCount;
        sendStatus(`Завантажено ${currentRowCount} транзакцій...`, 'pending');
      }
    }
    
    // Повертаємося на початок списку
    scrollContainer.scrollTo({ top: 0, behavior: 'auto' });
    await sleep(500);
    
    sendStatus('Завантаження транзакцій завершено', 'success');
  } catch (error) {
    console.error("Error in loadAllTransactions:", error);
    sendStatus(`Помилка завантаження транзакцій: ${error.message}`, 'error');
  }
}

// Функція для пошуку витрат на зняття готівки
async function findCashWithdrawals(searchText = "Зняття готівки: Банкомат") {
  try {
    sendStatus('Початок пошуку транзакцій зняття готівки...', 'pending');
    
    // Завантажуємо всі транзакції, прокручуючи до кінця списку
    await loadAllTransactions();
    
    // Знаходимо всі видимі транзакції
    const rows = document.querySelectorAll('.cypress-log-row');
    if (rows.length === 0) {
      sendStatus('Помилка: Записи транзакцій не знайдено', 'error');
      return;
    }
    
    sendStatus(`Знайдено ${rows.length} транзакцій в поточному відображенні`, 'success');
    
    // Додаємо стиль для підсвічування до документа, якщо його ще немає
    if (!document.getElementById('finmap-bot-highlight-style')) {
      const style = document.createElement('style');
      style.id = 'finmap-bot-highlight-style';
      style.textContent = `
        .finmap-bot-highlight {
          background-color: rgba(0, 178, 142, 0.2) !important;
          border: 2px solid #00B28E !important;
          transition: background-color 0.3s ease;
        }
        .finmap-cash-withdrawal {
          background-color: rgba(255, 193, 7, 0.3) !important;
          border: 2px solid #FFC107 !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Прокручуємо до першої транзакції
    const scrollContainer = document.querySelector('.ReactVirtualized__Grid');
    if (!scrollContainer) {
      sendStatus('Помилка: Не вдалося знайти контейнер для прокрутки', 'error');
      return;
    }
    
    // Прокручуємо вгору, щоб почати з початку списку
    scrollContainer.scrollTo({ top: 0, behavior: 'auto' });
    await sleep(500);
    
    // Лічильник знайдених транзакцій
    let matchCount = 0;
    let totalAmount = 0;
    
    // Функція для перевірки і підсвічування транзакцій
    const checkAllVisibleRows = () => {
      const visibleRows = document.querySelectorAll('.cypress-log-row');
      
      visibleRows.forEach(row => {
        // Шукаємо суму (має бути від'ємною для витрат)
        const amountElements = row.querySelectorAll('p');
        let amountText = '';
        let amount = 0;
        let isExpense = false;
        
        // Шукаємо текст, який виглядає як сума з мінусом
        for (const element of amountElements) {
          const text = element.textContent.trim();
          if (text.startsWith('-') && /^-[\d\s.,]+$/.test(text.replace(/\s/g, ''))) {
            amountText = text;
            // Перетворюємо текст у числове значення
            amount = parseFloat(text.replace(/\s/g, '').replace(',', '.'));
            isExpense = true;
            break;
          }
        }
        
        if (!isExpense) return; // Якщо це не витрата, пропускаємо
        
        // Шукаємо коментар
        let comment = '';
        const commentElements = row.querySelectorAll('p, span');
        
        for (const element of commentElements) {
          const text = element.textContent.trim();
          if (text.includes(searchText)) {
            comment = text;
            break;
          }
        }
        
        // Якщо це витрата і коментар містить пошуковий текст
        if (isExpense && comment.includes(searchText)) {
          // Підсвічуємо знайдений рядок спеціальним класом
          row.classList.add('finmap-bot-highlight');
          row.classList.add('finmap-cash-withdrawal');
          matchCount++;
          totalAmount += Math.abs(amount); // Додаємо до загальної суми
          
          // Додаємо підказку з інформацією
          row.title = `Зняття готівки: ${Math.abs(amount).toFixed(2)}`;
        }
      });
      
      return { matchCount, totalAmount };
    };
    
    // Прокручуємо сторінку і аналізуємо транзакції
    let lastScrollTop = -1;
    let scrollAttempts = 0;
    const maxScrollAttempts = 50;
    
    while (scrollAttempts < maxScrollAttempts) {
      // Перевіряємо видимі рядки
      const result = checkAllVisibleRows();
      
      // Запам'ятовуємо поточну позицію прокрутки
      const currentScrollTop = scrollContainer.scrollTop;
      
      // Якщо позиція прокрутки не змінилася після останньої прокрутки, завершуємо
      if (currentScrollTop === lastScrollTop) {
        break;
      }
      
      // Прокручуємо вниз
      lastScrollTop = currentScrollTop;
      scrollContainer.scrollBy({ top: 500, behavior: 'auto' });
      await sleep(500);
      scrollAttempts++;
    }
    
    // Повертаємося на початок списку, щоб було видно результати
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (matchCount > 0) {
      sendStatus(`Знайдено ${matchCount} транзакцій зняття готівки на загальну суму ${totalAmount.toFixed(2)}`, 'success', true);
    } else {
      sendStatus('Транзакцій зняття готівки не знайдено', 'warning', true);
    }
    
    // Додаємо інформаційний блок з результатами
    const infoBlock = document.createElement('div');
    infoBlock.style.position = 'fixed';
    infoBlock.style.bottom = '20px';
    infoBlock.style.right = '20px';
    infoBlock.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    infoBlock.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
    infoBlock.style.padding = '15px';
    infoBlock.style.borderRadius = '5px';
    infoBlock.style.zIndex = '9999';
    infoBlock.style.maxWidth = '300px';
    infoBlock.style.fontSize = '14px';
    infoBlock.innerHTML = `
     <div style="margin-top: 10px; font-size: 12px; color: #666;">Пошуковий текст: "${searchText}"</div>
      <button id="closeInfoBlock" style="margin-top: 10px; padding: 5px 10px; background-color: #00B28E; color: white; border: none; border-radius: 3px; cursor: pointer;">Закрити</button>
    `;
    
    document.body.appendChild(infoBlock);
    
    // Додаємо обробник для кнопки закриття
    document.getElementById('closeInfoBlock').addEventListener('click', () => {
      document.body.removeChild(infoBlock);
    });
    
  } catch (error) {
    console.error("Error in findCashWithdrawals:", error);
    sendStatus(`Помилка пошуку транзакцій: ${error.message}`, 'error');
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("Received message in content script:", request);
  
  // Перевіряємо, що повідомлення від нашого розширення
  if (sender.id !== chrome.runtime.id) return true;
  
  if (request.action === "selectAllTime") {
    sendResponse({status: 'started'});
    selectAllTime();
  } else if (request.action === "filterByDate") {
    sendResponse({status: 'started'});
    
    // Якщо включено опцію пошуку зняття готівки
    if (request.findCashWithdrawals) {
      filterByDate(
        request.periodType, 
        request.startDate, 
        request.endDate, 
        request.cashWithdrawalText
      );
    } else {
      // Без опції зняття готівки, використовуємо стандартну фільтрацію
      filterByDate(request.periodType, request.startDate, request.endDate);
    }
  }
  
  return true;
});

// Log that the content script has loaded
console.log("Finmap Bot content script ready");

// Додаємо функцію для спостереження за змінами в DOM
function setupMutationObserver() {
  // Функція, яка буде викликатися при змінах в DOM
  const observerCallback = (mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && 
          mutation.addedNodes.length > 0 &&
          document.querySelector('.ReactVirtualized__Grid')) {
        // Коли з'являються нові транзакції, можемо запустити додаткову логіку
        console.log("Detected new transactions being loaded");
      }
    }
  };

  // Створюємо спостерігача
  const observer = new MutationObserver(observerCallback);

  // Чекаємо на появу контейнера з транзакціями
  setTimeout(() => {
    const targetNode = document.querySelector('.ReactVirtualized__Grid');
    if (targetNode) {
      // Налаштовуємо опції спостереження
      const config = { childList: true, subtree: true };
      
      // Починаємо спостереження
      observer.observe(targetNode, config);
      console.log("Mutation observer set up for transaction list");
    }
  }, 3000);
}

// Викликаємо функцію налаштування спостерігача після завантаження
setupMutationObserver();