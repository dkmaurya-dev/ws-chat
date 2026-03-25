import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
        index: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['user', 'system'],
        default: 'user',
    },
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
