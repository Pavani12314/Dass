const express = require('express');
const router = express.Router();
const {
  getForumMessages,
  postMessage,
  togglePin,
  deleteMessage,
  reactToMessage
} = require('../controllers/forumController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/:eventId', getForumMessages);
router.post('/:eventId', postMessage);
router.put('/:messageId/pin', togglePin);
router.delete('/:messageId', deleteMessage);
router.post('/:messageId/react', reactToMessage);

module.exports = router;
