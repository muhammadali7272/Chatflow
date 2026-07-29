import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectContacts, setContacts } from '../../features/users/usersSlice';
import { setSelectedChatUserId } from '../../features/chat/chatSlice';
import { selectUser } from '../../features/auth/authSlice';
import { fetchContacts } from '../../services/chatService';
import ChatWindow from '../../components/ChatWindow/ChatWindow';

// Resolves the open conversation partner from the server-truth contact list
// (`contacts:list`). Everyone reachable at /chat/:userId is a contact:
// the discovery page adds before navigating, and the first message of any
// chat auto-adds both sides server-side.
const Chat = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const contacts = useSelector(selectContacts);
  const currentUser = useSelector(selectUser);

  // Direct URL / reload case — the sidebar usually loads this already.
  useEffect(() => {
    if (contacts.length === 0 && currentUser?._id) {
      fetchContacts(currentUser._id)
        .then((list) => dispatch(setContacts(list || [])))
        .catch(() => {});
    }
  }, [dispatch, contacts.length, currentUser?._id]);

  const selectedUser = useMemo(() => {
    if (!userId) return null;
    return contacts.find((u) => u._id === userId) || null;
  }, [userId, contacts]);

  useEffect(() => {
    dispatch(setSelectedChatUserId(selectedUser?._id || null));
  }, [selectedUser, dispatch]);

  return <ChatWindow selectedUser={selectedUser} />;
};

export default Chat;
