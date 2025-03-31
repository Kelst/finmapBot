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

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("Received message in content script:", request);
  if (request.action === "selectAllTime") {
    sendResponse({status: 'started'});
    selectAllTime();
  }
  return true;
});

// Log that the content script has loaded
console.log("Finmap Bot content script ready");