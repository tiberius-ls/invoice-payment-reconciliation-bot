function checkOverdueInvoices() {
  var sheet = SpreadsheetApp.openById("YOUR_GOOGLE_SHEET_ID").getSheetByName("Sheet1");
  var data = sheet.getDataRange().getValues();
  
  var botToken = "YOUR_TELEGRAM_BOT_TOKEN";
  var chatId = "YOUR_TELEGRAM_CHAT_ID";
  
  var overdueList = [];
  
  for (var i = 1; i < data.length; i++) {
    var clientName = data[i][0];
    var amount = data[i][1];
    var status = data[i][3];
    var daysOverdue = data[i][4];
    
    if (status === "Unpaid" && daysOverdue > 0) {
      overdueList.push(clientName + " — ₦" + amount + " — " + daysOverdue + " days overdue");
    }
  }
  
  var message;
   if (overdueList.length > 0) {
     message = "⚠️ Overdue Invoices:\n\n" + overdueList.join("\n");
   } else {
     message = "✅ No overdue invoices today. All clear!";
   }
   sendTelegramMessage(botToken, chatId, message);
}

function sendTelegramMessage(botToken, chatId, message) {
  var url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
  var payload = {
    chat_id: chatId,
    text: message
  };
  var options = {
    method: "post",
    payload: payload
  };
  UrlFetchApp.fetch(url, options);
}

function createPaystackInvoice(rowNumber) {
  var sheet = SpreadsheetApp.openById("YOUR_GOOGLE_SHEET_ID").getSheetByName("Sheet1");
  var secretKey = "YOUR_PAYSTACK_TEST_SECRET_KEY";
  
  var existingReference = sheet.getRange(rowNumber, 6).getValue();
  if (existingReference) {
    Logger.log("Row " + rowNumber + " already has a reference: " + existingReference + ". Skipping.");
    return;
  }
  
  var clientName = sheet.getRange(rowNumber, 1).getValue();
  var amount = sheet.getRange(rowNumber, 2).getValue();
  
  var url = "https://api.paystack.co/transaction/initialize";
  var payload = {
    email: "test@example.com",
    amount: amount * 100
  };
  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + secretKey
    },
    payload: JSON.stringify(payload)
  };
  
  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());
  
  if (data.status === true) {
    var reference = data.data.reference;
    var paymentLink = data.data.authorization_url;
    
    sheet.getRange(rowNumber, 6).setValue(reference);
    sheet.getRange(rowNumber, 7).setValue(paymentLink);
    
    Logger.log("Reference: " + reference);
    Logger.log("Link: " + paymentLink);
  } else {
    Logger.log("Error: " + data.message);
  }
}

function testCreateInvoice() {
     createPaystackInvoice(2);
   }

function verifyPayment(rowNumber) {
  var sheet = SpreadsheetApp.openById("YOUR_GOOGLE_SHEET_ID").getSheetByName("Sheet1");
  var secretKey = "YOUR_PAYSTACK_TEST_SECRET_KEY";
  
  var reference = sheet.getRange(rowNumber, 6).getValue();
  
  if (!reference) {
    Logger.log("No reference found for this row.");
    return;
  }
  
  var url = "https://api.paystack.co/transaction/verify/" + reference;
  var options = {
    method: "get",
    headers: {
      Authorization: "Bearer " + secretKey
    }
  };
  
  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());
  
  if (data.status === true && data.data.status === "success") {
    sheet.getRange(rowNumber, 4).setValue("Paid");
    Logger.log("Payment confirmed — status updated to Paid.");
  } else {
    Logger.log("Payment not yet completed. Status: " + data.data.status);
  }
}

function verifyAllPayments() {
  var sheet = SpreadsheetApp.openById("YOUR_GOOGLE_SHEET_ID").getSheetByName("Sheet1");
  var data = sheet.getDataRange().getValues();
  var botToken = "YOUR_TELEGRAM_BOT_TOKEN";
  var chatId = "YOUR_TELEGRAM_CHAT_ID";
  
  for (var i = 1; i < data.length; i++) {
    var status = data[i][3];
    var reference = data[i][5];
    var rowNumber = i + 1;
    
    if (status === "Unpaid" && reference) {
      try {
        verifyPayment(rowNumber);
      } catch (error) {
        var errorMsg = "🚨 Error checking payment for row " + rowNumber + ": " + error.message;
        Logger.log(errorMsg);
        sendTelegramMessage(botToken, chatId, errorMsg);
      }
    }
  }
}

function testCreateInvoiceRow3() {
     createPaystackInvoice(3);
   }


function sendOverdueReminders() {
  var sheet = SpreadsheetApp.openById("YOUR_GOOGLE_SHEET_ID").getSheetByName("Sheet1");
  var data = sheet.getDataRange().getValues();
  
  var greenApiInstance = "YOUR_GREEN_API_INSTANCE_ID";
  var greenApiToken = "YOUR_GREEN_API_TOKEN";
  
  for (var i = 1; i < data.length; i++) {
    var clientName = data[i][0];
    var amount = data[i][1];
    var status = data[i][3];
    var daysOverdue = data[i][4];
    var clientPhone = data[i][7];
    
    if (status === "Unpaid" && daysOverdue > 0 && clientPhone) {
      var message = "Hi " + clientName + ", this is a friendly reminder that your invoice of ₦" + amount + " is now " + daysOverdue + " days overdue. Kindly arrange payment at your earliest convenience. Thank you!";
      
      var url = "https://7107.api.greenapi.com/waInstance" + greenApiInstance + "/sendMessage/" + greenApiToken;
      var payload = {
        chatId: clientPhone + "@c.us",
        message: message
      };
      var options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload)
      };
      
      try {
        UrlFetchApp.fetch(url, options);
        Logger.log("Reminder sent to " + clientName);
      } catch (error) {
        Logger.log("Failed to send reminder to " + clientName + ": " + error.message);
      }
    }
  }
}
