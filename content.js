// content.js
console.log("Finmap Bot Extension loaded");

// Function to wait for specified milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
async function filterByDate(periodType, startDate, endDate) {
  try {
    sendStatus('Початок фільтрації за датою...', 'pending');
    
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
        // Отримуємо елемент з датою
        const dateElements = row.querySelectorAll('p');
        let dateText = '';
        
        // Шукаємо текст, який виглядає як дата
        for (const element of dateElements) {
          const text = element.textContent.trim();
          if (/^\d{1,2}\s+[а-яіїє]{3}\s+\d{4}$/i.test(text)) {
            dateText = text;
            break;
          }
        }
        
        if (!dateText) continue;
        
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
            sendStatus(`Знайдено ${matchCount} транзакцій за вказаний період, досягнуто кінця діапазону`, 'success', true);
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
            sendStatus(`Знайдено ${matchCount} транзакцій за вказаний період, досягнуто кінця списку`, 'success', true);
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
            sendStatus(`Знайдено ${matchCount} транзакцій за вказаний період, досягнуто кінця списку`, 'success', true);
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
    filterByDate(request.periodType, request.startDate, request.endDate);
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