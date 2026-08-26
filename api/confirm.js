module.exports = async function handler(req, res) {
  res.status(200).json({ 
    status: "disabled", 
    message: "Auto-sending emails on submit is disabled to prevent Google SMTP from locking the university account. Emails are processed in safe randomized batches using the send-confirmations.js script." 
  });
};
