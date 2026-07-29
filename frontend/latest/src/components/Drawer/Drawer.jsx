import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { selectUser, updateUser, logout as logoutAction } from '../../features/auth/authSlice';
import { updateProfile } from '../../services/profileService';
import { getInitials, getAvatarColor, getDisplayName } from '../../utils/helpers';
import { disconnectSocket } from '../../services/socket';
import { useNavigate } from 'react-router-dom';
import {
  FiUser, FiSettings, FiMoon, FiSun, FiX,
  FiSave, FiLogOut, FiGlobe, FiClock, FiActivity, FiPhone,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/I18nContext';

const Drawer = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);
  const { t, lang, setLang } = useI18n();
  const [activeView, setActiveView] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    bio: '',
    phone: '',
    avatar: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const initials = getInitials(getDisplayName(currentUser));
  const avatarColor = getAvatarColor(currentUser?._id || currentUser?.id);

  const nightMode = currentUser?.theme !== 'light';

  const openProfile = useCallback(() => {
    setActiveView('profile');
    setFormData({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      username: currentUser?.username || '',
      bio: currentUser?.bio || '',
      phone: currentUser?.phone || '',
      avatar: currentUser?.avatar || '',
    });
    setEditMode(false);
    setFieldErrors({});
  }, [currentUser]);

  const openSettings = useCallback(() => {
    setActiveView('settings');
  }, []);

  const closeView = useCallback(() => {
    setActiveView(null);
    setEditMode(false);
    setFieldErrors({});
  }, []);

  const handleEditToggle = useCallback(() => {
    if (editMode) {
      setFormData({
        firstName: currentUser?.firstName || '',
        lastName: currentUser?.lastName || '',
        username: currentUser?.username || '',
        bio: currentUser?.bio || '',
        phone: currentUser?.phone || '',
        avatar: currentUser?.avatar || '',
      });
      setFieldErrors({});
    }
    setEditMode(!editMode);
  }, [editMode, currentUser]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (formData.bio && formData.bio.length > 300) errors.bio = 'Bio must be 300 characters or less';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const result = await updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || null,
        username: formData.username.trim() || null,
        bio: formData.bio.trim() || null,
        phone: formData.phone.trim() || null,
        avatar: formData.avatar.trim() || null,
      });
      if (result.user) {
        dispatch(updateUser(result.user));
        toast.success(t('toast.profileUpdated'));
        setEditMode(false);
      }
    } catch (err) {
      toast.error(err.error || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, dispatch]);

  const handleToggleTheme = useCallback(async () => {
    const newTheme = nightMode ? 'light' : 'dark';
    try {
      const result = await updateProfile({ theme: newTheme });
      if (result.user) {
        dispatch(updateUser(result.user));
      }
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    } catch {
      // Just toggle locally
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      dispatch(updateUser({ theme: newTheme }));
    }
  }, [nightMode, dispatch]);

  const handleLogout = useCallback(() => {
    disconnectSocket();
    dispatch(logoutAction());
    toast.success(t('toast.loggedOut'));
    navigate('/login');
  }, [dispatch, navigate]);

  const handleTogglePrivacy = useCallback(async (key) => {
    const defaults = { lastSeen: 'everyone', onlineStatus: 'everyone', phone: 'nobody' };
    const current = currentUser?.privacy?.[key] || defaults[key];
    const next = current === 'everyone' ? 'nobody' : 'everyone';
    try {
      const result = await updateProfile({ privacy: { [key]: next } });
      if (result.user) {
        dispatch(updateUser(result.user));
      }
    } catch (err) {
      toast.error(err.error || 'Failed to update privacy setting');
    }
  }, [currentUser, dispatch]);

  const handleLanguageChange = useCallback((newLang) => {
    // Apply immediately (reactive UI), persist locally, then sync to profile.
    setLang(newLang);
    dispatch(updateUser({ language: newLang }));
    toast.success(t('toast.languageSet'));
    updateProfile({ language: newLang }).catch(() => { /* non-blocking */ });
  }, [dispatch, setLang, t]);

  const menuItems = [
    { id: 'profile', icon: FiUser, label: t('account.myProfile'), action: openProfile },
    { id: 'settings', icon: FiSettings, label: t('account.settings'), action: openSettings },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 max-w-[90vw] bg-[var(--c-surface)] border-l border-[var(--c-border)] shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between bg-[var(--c-surface-2)]">
              <h2 className="text-[var(--c-text)] font-semibold text-lg">{t('account.title')}</h2>
              <button
                onClick={onClose}
                className="p-2 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded-lg transition-all"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeView === 'profile' ? (
                <div className="p-5">
                  <button
                    onClick={closeView}
                    className="flex items-center gap-1.5 text-sm text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors duration-200 mb-5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {t('common.back')}
                  </button>

                  {/* Avatar */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative group">
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl ring-2 ring-[var(--c-border)]"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initials}
                      </div>
                      {editMode && (
                        <div className="mt-3 w-full">
                          <label className="block text-xs text-[var(--c-text-muted)] mb-1">Avatar URL</label>
                          <input
                            type="text"
                            name="avatar"
                            value={formData.avatar}
                            onChange={handleChange}
                            placeholder="https://example.com/avatar.jpg"
                            className="w-full bg-[var(--c-input)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-sm text-[var(--c-text)] placeholder-[var(--c-placeholder)] outline-none focus:border-[var(--c-primary)]/50"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile fields */}
                  <div className="space-y-4">
                    {/* Username */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--c-text-muted)] mb-1">Username</label>
                      {editMode ? (
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          placeholder="username"
                          className="w-full bg-[var(--c-input)] border border-[var(--c-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--c-text)] placeholder-[var(--c-placeholder)] outline-none focus:border-[var(--c-primary)]/50"
                        />
                      ) : (
                        <p className="text-[var(--c-text)] text-sm">
                          {currentUser?.username ? `@${currentUser.username}` : 'Not set'}
                        </p>
                      )}
                    </div>

                    {/* First Name */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--c-text-muted)] mb-1">First Name</label>
                      {editMode ? (
                        <>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={`w-full bg-[var(--c-input)] border ${fieldErrors.firstName ? 'border-[var(--c-danger)]' : 'border-[var(--c-border)]'} rounded-lg px-3 py-2.5 text-sm text-[var(--c-text)] placeholder-[var(--c-placeholder)] outline-none focus:border-[var(--c-primary)]/50`}
                          />
                          {fieldErrors.firstName && (
                            <p className="text-[var(--c-danger-text)] text-xs mt-1">{fieldErrors.firstName}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-[var(--c-text)] text-sm">{currentUser?.firstName || 'Not set'}</p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--c-text-muted)] mb-1">Last Name</label>
                      {editMode ? (
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full bg-[var(--c-input)] border border-[var(--c-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--c-text)] placeholder-[var(--c-placeholder)] outline-none focus:border-[var(--c-primary)]/50"
                        />
                      ) : (
                        <p className="text-[var(--c-text)] text-sm">{currentUser?.lastName || 'Not set'}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--c-text-muted)] mb-1">Phone</label>
                      {editMode ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+1 234 567 8900"
                          className="w-full bg-[var(--c-input)] border border-[var(--c-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--c-text)] placeholder-[var(--c-placeholder)] outline-none focus:border-[var(--c-primary)]/50"
                        />
                      ) : (
                        <p className="text-[var(--c-text)] text-sm">{currentUser?.phone || 'Not set'}</p>
                      )}
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--c-text-muted)] mb-1">Bio</label>
                      {editMode ? (
                        <>
                          <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell something about yourself..."
                            rows={3}
                            maxLength={300}
                            className={`w-full bg-[var(--c-input)] border ${fieldErrors.bio ? 'border-[var(--c-danger)]' : 'border-[var(--c-border)]'} rounded-lg px-3 py-2.5 text-sm text-[var(--c-text)] placeholder-[var(--c-placeholder)] outline-none focus:border-[var(--c-primary)]/50 resize-none`}
                          />
                          <p className="text-xs text-[var(--c-text-muted)] mt-1 text-right">{formData.bio.length}/300</p>
                        </>
                      ) : (
                        <p className="text-[var(--c-text-muted)] text-sm">{currentUser?.bio || 'No bio yet'}</p>
                      )}
                    </div>

                    {/* Email (read-only) */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--c-text-muted)] mb-1">Email</label>
                      <p className="text-[var(--c-text-muted)] text-sm">{currentUser?.email}</p>
                    </div>
                  </div>

                  {/* Edit / Save buttons */}
                  <div className="mt-6 flex gap-3">
                    {editMode ? (
                      <>
                        <button
                          onClick={handleEditToggle}
                          className="flex-1 py-2.5 bg-[var(--c-neutral)] hover:bg-[var(--c-neutral-hover)] text-[var(--c-neutral-content)] font-medium rounded-xl transition-colors duration-200 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex-1 py-2.5 bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                        >
                          {saving ? (
                            <span className="loading loading-spinner loading-sm"></span>
                          ) : (
                            <><FiSave size={15} /> Save</>
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEditToggle}
                        className="w-full py-2.5 bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white font-medium rounded-xl transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>
              ) : activeView === 'settings' ? (
                /* Settings View */
                <div className="p-5">
                  <button
                    onClick={closeView}
                    className="flex items-center gap-1.5 text-sm text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors duration-200 mb-5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {t('common.back')}
                  </button>

                  <div className="space-y-2">
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--c-input)]">
                      <div className="flex items-center gap-3">
                        {nightMode ? <FiMoon size={18} className="text-[var(--c-primary)]" /> : <FiSun size={18} className="text-yellow-400" />}
                        <span className="text-sm text-[var(--c-text)]">{nightMode ? t('settings.darkMode') : t('settings.lightMode')}</span>
                      </div>
                      <button
                        onClick={handleToggleTheme}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${nightMode ? 'bg-[var(--c-primary)]' : 'bg-[var(--c-neutral-hover)]'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${nightMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

                    {/* Language */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--c-input)]">
                      <div className="flex items-center gap-3">
                        <FiGlobe size={18} className="text-[var(--c-text-muted)]" />
                        <span className="text-sm text-[var(--c-text)]">{t('settings.language')}</span>
                      </div>
                      <select
                        value={lang}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--c-text)] outline-none"
                      >
                        <option value="en">English</option>
                        <option value="uz">O'zbek</option>
                        <option value="ru">Русский</option>
                      </select>
                    </div>

                    {/* Privacy */}
                    <p className="px-1 pt-3 pb-1 text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider">Privacy</p>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--c-input)]">
                      <div className="flex items-center gap-3">
                        <FiClock size={18} className="text-[var(--c-text-muted)]" />
                        <div>
                          <span className="text-sm text-[var(--c-text)] block">Last Seen</span>
                          <span className="text-[11px] text-[var(--c-text-muted)]">Who can see when you were last online</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTogglePrivacy('lastSeen')}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 ${(currentUser?.privacy?.lastSeen || 'everyone') === 'everyone' ? 'bg-[var(--c-primary)]' : 'bg-[var(--c-neutral-hover)]'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${(currentUser?.privacy?.lastSeen || 'everyone') === 'everyone' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--c-input)]">
                      <div className="flex items-center gap-3">
                        <FiActivity size={18} className="text-[var(--c-text-muted)]" />
                        <div>
                          <span className="text-sm text-[var(--c-text)] block">Online Status</span>
                          <span className="text-[11px] text-[var(--c-text-muted)]">Who can see when you're online</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTogglePrivacy('onlineStatus')}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 ${(currentUser?.privacy?.onlineStatus || 'everyone') === 'everyone' ? 'bg-[var(--c-primary)]' : 'bg-[var(--c-neutral-hover)]'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${(currentUser?.privacy?.onlineStatus || 'everyone') === 'everyone' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--c-input)]">
                      <div className="flex items-center gap-3">
                        <FiPhone size={18} className="text-[var(--c-text-muted)]" />
                        <div>
                          <span className="text-sm text-[var(--c-text)] block">Phone Number</span>
                          <span className="text-[11px] text-[var(--c-text-muted)]">Who can see your phone number</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTogglePrivacy('phone')}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 ${(currentUser?.privacy?.phone || 'nobody') === 'everyone' ? 'bg-[var(--c-primary)]' : 'bg-[var(--c-neutral-hover)]'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${(currentUser?.privacy?.phone || 'nobody') === 'everyone' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--c-danger)]/5 hover:bg-[var(--c-danger)]/10 transition-colors"
                    >
                      <FiLogOut size={18} className="text-[var(--c-danger-text)]" />
                      <span className="text-sm text-[var(--c-danger-text)] font-medium">{t('settings.logout')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Menu */
                <div className="p-3 space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] transition-all duration-200 group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[var(--c-input)] flex items-center justify-center group-hover:bg-[var(--c-primary)]/10 group-hover:text-[var(--c-primary)] transition-all duration-200">
                          <Icon size={18} />
                        </div>
                        <span className="font-medium text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Drawer;
