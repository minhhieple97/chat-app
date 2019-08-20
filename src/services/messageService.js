import ContactModel from './../models/contactModel';
import UserModel from './../models/userModel';
import ChatGroupModel from './../models/chatGroupModel';
import { model as MessageModel, MESSAGE_CONVERSATION_TYPES, MESSAGE_TYPES } from './../models/messageModel';
import _ from 'lodash';
import {transErrorsMessage} from './../../lang/vi';
const LIMIT_CONVERSATIONS_TAKEN = 15;
const LIMIT_MESSAGES_TAKEN = 30;
const getAllConversationItems = (currentUserId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const skip = 0
      const contacts = await ContactModel.getContacts(currentUserId, skip, LIMIT_CONVERSATIONS_TAKEN);//Lấy tất cả các liên hệ trong danh bạ
      let userConversations = await Promise.all(contacts.map(async (contact) => {//Lấy các thông tin của các user trong danh bạ
        const getUserContact = await UserModel.findListContacts(contact.userId, contact.contactId, currentUserId);
        getUserContact[0].updatedAt = contact.updatedAt;
        return getUserContact[0];
      }));
      const groupConversations = await ChatGroupModel.getChatGroups(currentUserId, LIMIT_CONVERSATIONS_TAKEN);//Tìm các group mà user hiện tại là thành viên
      const allConversations = userConversations.concat(groupConversations).sort((itemPre, itemNext) => {//
        return itemNext.updatedAt - itemPre.updatedAt
      });//hàm này append 2 mảng lại với nhau (mảng chứa các thông tin các liên hệ trong danh bạ và mảng còn lại là các group mà user hiện tại nằm bên trong)
      let allConversationWithMessage = await Promise.all(allConversations.map(async (conversation) => {//
        //Mỗi conversation đại diện cho một liên lạc của user hiện tại 
        //hoặc một group mà user hiện tại nằm bên trong
        if (conversation.members) {
          let getMessages = await MessageModel.getMessagesChatGroup(conversation._id,LIMIT_MESSAGES_TAKEN);//Lấy tất cả tin nhắn trong cuộc trò chuyện
          conversation.messages = getMessages;
        } else {
          let getMessages = await MessageModel.getMessagesInPersonal(currentUserId, conversation._id, LIMIT_MESSAGES_TAKEN);
          conversation.messages = getMessages;
        }
        return conversation;
      }));
      allConversationWithMessage = allConversationWithMessage.sort((itemPre, itemNext) => {
        return itemNext.updatedAt - itemPre.updatedAt;
      });//Sắp xếp danh sách các cuộc trò chuyện từ trò chuyện gần nhất đến cũ nhất
      ;
      resolve({
        allConversationWithMessage
      });
    } catch (error) {
      reject(error);
    }
  })
};
const addNewMessage = (sender,receiverId,messageVal,isChatGroup)=>{
  return new Promise(async(resolve,reject)=>{
     try {
       if(isChatGroup){
         const chatGroupReceiver = await ChatGroupModel.getChatGroupById(receiverId);
         if(!chatGroupReceiver) 
         {
           reject(new Error(transErrorsMessage.MESSAGE_ERROR_GROUP));
         }
         const receiver = {
           id:chatGroupReceiver._id,
           name:chatGroupReceiver.name,
           avatar:'https://static.tendant.com/static/new_ux/img/chat-group-big.png'
         };
         const message = {
          senderId:sender.id,
          receiverId:receiver.id,
          conversationType:MESSAGE_CONVERSATION_TYPES.GROUP,
          messageType:MESSAGE_TYPES.TEXT,
          sender,
          receiver,
          text:messageVal,
          createdAt: Date.now(),
         }
         const message_ = await MessageModel.createNew(message);
         await ChatGroupModel.updateWhenHasNewMessage(chatGroupReceiver._id,chatGroupReceiver.messageAmount+1)
         resolve(message_);
       }
       else {
        const receiver_ = await UserModel.findUserById(receiverId);
        if(!receiver_) {
          reject(new Error(transErrorsMessage.MESSAGE_ERROR_GROUP));
        }
        const receiver = {
          id:receiver_._id,
          name:receiver_.name,
          avatar:receiver_.avatar
        };
        const message = {
         senderId:sender.id,
         receiverId:receiver.id,
         conversationType:MESSAGE_CONVERSATION_TYPES.PERSONAL,
         messageType:MESSAGE_TYPES.TEXT,
         sender,
         receiver,
         text:messageVal,
         createdAt: Date.now()
        }
        const message_ = await MessageModel.createNew(message);
        await ContactModel.updateWhenHasNewMessage(sender.id,receiver.id);
        resolve(message_);
       }
     } catch (error) {
       console.log(error)
       reject(error);
     }
  });
};
export {
  getAllConversationItems,
  addNewMessage
}

 