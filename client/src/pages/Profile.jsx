import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Camera,
  Edit3,
  MapPin,
  Calendar,
  Users,
  Award,
  MessageCircle,
  UserPlus,
  Phone,
  Heart,
  Mail,
} from "lucide-react";
import axios from "axios";
import ProfileLayout from "../components/profile/ProfileLayout";
import { useUser } from "../context/UserContext";
import PostList from "../components/post/PostList";
import teamColors from "../utils/teamStyles";
import teamNameMap from "../utils/teams-hebrew";
import CropModal from "../components/profile/CropModal";
import getCroppedImg from "../utils/cropImage";
import "styles/index.css";

const Profile = () => {
  const { userId } = useParams(); // משיכת userId מה-URL
  const { user: currentUser, setUser } = useUser();
  const [profileUser, setProfileUser] = useState(null); // המשתמש שאת הפרופיל שלו אנחנו מציגים
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coverImage, setCoverImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);
  const coverInputRef = useRef(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  // בדיקה אם זה הפרופיל של המשתמש הנוכחי או של מישהו אחר
  const isOwnProfile = !userId || userId === currentUser?._id;
  const displayUser = isOwnProfile ? currentUser : profileUser;
  const colors = teamColors[displayUser?.favoriteTeam || "הפועל תל אביב"];

  // Helper function to get team data
  const getTeamData = () => {
    const teamEnglishName = Object.keys(teamNameMap).find(
      (key) => teamNameMap[key].name === displayUser?.favoriteTeam
    );
    return teamNameMap[teamEnglishName] || {};
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        let targetUserId = isOwnProfile ? currentUser._id : userId;

        // אם זה לא הפרופיל שלנו, נשלוף את פרטי המשתמש
        if (!isOwnProfile) {
          const profileResponse = await axios.get(
            `http://localhost:3001/api/users/profile/${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setProfileUser(profileResponse.data);
          targetUserId = userId;
        }

        // שליפת פוסטים של המשתמש
        const postsResponse = await axios.get(
          `http://localhost:3001/api/posts?authorId=${targetUserId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserPosts(postsResponse.data);

        // סימולציה של מספר חברים
        setFriendsCount(Math.floor(Math.random() * 500) + 50);

        // הגדרת תמונת קאבר
        if (isOwnProfile && currentUser.coverImage) {
          setCoverImage(currentUser.coverImage);
        } else if (!isOwnProfile && profileUser.coverImage) {
          setCoverImage(profileUser.coverImage);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    if ((isOwnProfile && currentUser) || (!isOwnProfile && userId)) {
      fetchUserData();
    }
  }, [currentUser, userId, isOwnProfile, profileUser]);

  const handleCoverUpload = (event) => {
    if (!isOwnProfile) return;

    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("הקובץ גדול מדי. גודל מקסימלי: 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("אנא בחר קובץ תמונה בלבד");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result); // מציג למשתמש את התמונה בתוך CropModal
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // בפונקציית onCropComplete של CropModal:
  const uploadCroppedImage = async (croppedBlob) => {
    const formData = new FormData();
    formData.append("coverImage", croppedBlob);

    setUploading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        "http://localhost:3001/api/users/upload-cover",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setCoverImage(response.data.coverImage);
      setUser((prev) => ({ ...prev, coverImage: response.data.coverImage }));
    } catch (error) {
      console.error("Error uploading cover image:", error);
      alert("שגיאה בהעלאת תמונת קאבר");
    } finally {
      setUploading(false);
      setCropModalOpen(false);
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    }
    return phone;
  };

  const formatJoinDate = (date) => {
    return new Date(date).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
    });
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <span>טוען פרופיל...</span>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-red-600 mb-4">שגיאה</h2>
        <p className="text-gray-600">הפרופיל לא נמצא</p>
      </div>
    );
  }
  console.log("COVER:", coverImage);

  return (
    <ProfileLayout>
      <div className="profile-container bg-gray-50" dir="rtl">
        {/* תמונת קאבר */}
        <div className="relative profile-cover h-64 md:h-80 rounded-b-2xl overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              }}
            />
          )}

          <div className="cover-overlay" />

          {/* כפתור העלאת תמונת קאבר - רק למשתמש עצמו */}
          {isOwnProfile && (
            <button
              onClick={() => coverInputRef.current?.click()}
              className="upload-cover-btn"
              disabled={uploading}
              title="שנה תמונת קאבר"
            >
              {uploading ? (
                <div className="animate-spin text-2xl">⏳</div>
              ) : (
                <Camera size={20} className="text-gray-700" />
              )}
            </button>
          )}

          {isOwnProfile && (
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
          )}
          {cropModalOpen && (
            <CropModal
              imageSrc={imageToCrop}
              onCancel={() => setCropModalOpen(false)}
              onCropComplete={uploadCroppedImage}
            />
          )}
        </div>

        {/* מידע פרופיל */}
        <div className="relative px-4 md:px-8 pb-6">
          <div className="animate-fade-in-up">
            <div className="flex flex-col lg:flex-row lg:items-end -mt-16 md:-mt-20 gap-6">
              {/* תמונת פרופיל ושם - מתחת לקאבר */}
              <div className="flex items-end gap-4">
                <div className="relative">
                  <img
                    src={
                      displayUser.profilePicture ||
                      "http://localhost:3001/assets/defaultProfilePic.png"
                    }
                    alt="Profile"
                    className="profile-avatar w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                  <div
                    className="profile-team-badge"
                    style={{ backgroundColor: colors.primary }}
                  />
                </div>

                {/* שם המשתמש */}
                <div className="pb-1">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">
                    {displayUser.name}
                  </h1>
                  <p className="text-gray-500 text-lg">
                    אוהד{" "}
                    <span style={{ color: colors.primary, fontWeight: "bold" }}>
                      {displayUser.favoriteTeam}
                    </span>
                  </p>
                </div>
              </div>

              {/* סטטיסטיקות ופעולות */}
              <div className="flex-1">
                <div className="profile-stats text-sm mb-4">
                  <div className="profile-stat">
                    <div className="flex items-center gap-2">
                      <Users size={20} />
                      <span className="font-bold">{friendsCount}</span>
                      <span className="font-bold">חברים</span>
                    </div>
                  </div>

                  <div className="profile-stat">
                    <div className="flex items-center gap-2">
                      <Award size={20} />
                      <span className="font-bold">{userPosts.length}</span>
                      <span className="font-bold">פוסטים</span>
                    </div>
                  </div>

                  <div className="profile-stat">
                    <div className="flex items-center gap-2">
                      <Calendar size={20} />
                      <span className="font-bold">
                        הצטרף ב{formatJoinDate(displayUser.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* כפתורי פעולה */}
                <div className="profile-actions">
                  {isOwnProfile ? (
                    <button
                      className="profile-btn secondary"
                      onClick={() => (window.location.href = "/settings")}
                    >
                      <Edit3 size={18} />
                      ערוך פרופיל
                    </button>
                  ) : (
                    <>
                      <button className="profile-btn primary">
                        <UserPlus size={18} />
                        הוסף לחברים
                      </button>
                      <button className="profile-btn secondary">
                        <MessageCircle size={18} />
                        שלח הודעה
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* רשת תוכן */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 profile-grid">
            {/* עמודה שמאל - מידע */}
            <div className="lg:col-span-1 space-y-6">
              {/* כרטיס מידע אישי */}
              <div className="profile-info-card">
                <h2 className="flex items-center gap-2">
                  <Users size={20} />
                  פרטים אישיים
                </h2>

                {displayUser.bio && (
                  <div className="mb-4">
                    <p className="profile-bio">
                      {showFullBio || displayUser.bio.length <= 100
                        ? displayUser.bio
                        : `${displayUser.bio.substring(0, 100)}...`}
                      {displayUser.bio.length > 100 && (
                        <button
                          onClick={() => setShowFullBio(!showFullBio)}
                          className="bio-toggle-btn"
                        >
                          {showFullBio ? "הצג פחות" : "הצג עוד"}
                        </button>
                      )}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {displayUser.location && (
                    <div className="profile-info-item">
                      <MapPin size={18} className="profile-info-icon" />
                      <span>מתגורר ב{displayUser.location}</span>
                    </div>
                  )}

                  {/* הצגת אימייל רק למשתמש עצמו */}
                  {isOwnProfile && displayUser.email && (
                    <div className="profile-info-item">
                      <Mail size={18} className="profile-info-icon" />
                      <span>{displayUser.email}</span>
                    </div>
                  )}

                  {/* הצגת טלפון רק למשתמש עצמו */}
                  {isOwnProfile && displayUser.phone && (
                    <div className="profile-info-item">
                      <Phone size={18} className="profile-info-icon" />
                      <span>{formatPhoneNumber(displayUser.phone)}</span>
                    </div>
                  )}

                  <div className="profile-info-item">
                    <Calendar size={18} className="profile-info-icon" />
                    <span>
                      הצטרף בתאריך{" "}
                      {new Date(displayUser.createdAt).toLocaleDateString(
                        "he-IL"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* כרטיס קבוצת הלב */}
              <div
                className="profile-team-card"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="profile-team-icon">
                    <Heart size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">קבוצת הלב</h3>
                    <p className="opacity-90 text-sm">
                      {displayUser.favoriteTeam}
                    </p>
                    {getTeamData().badge && (
                      <img
                        src={getTeamData().badge}
                        alt={displayUser.favoriteTeam}
                        className="w-8 h-8 mt-2 rounded object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* כרטיס מידע נוסף */}
              <div className="profile-info-card">
                <h2>פרטים נוספים</h2>

                <div className="space-y-3">
                  {displayUser.gender && (
                    <div className="profile-info-item">
                      <span className="w-5 h-5 flex-shrink-0 text-gray-500">
                        👤
                      </span>
                      <span>{displayUser.gender}</span>
                    </div>
                  )}

                  {displayUser.birthDate && (
                    <div className="profile-info-item">
                      <span className="w-5 h-5 flex-shrink-0 text-gray-500">
                        🎂
                      </span>
                      <span>
                        נולד ב-
                        {new Date(displayUser.birthDate).toLocaleDateString(
                          "he-IL"
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* עמודה ימין - פוסטים */}
            <div className="lg:col-span-2">
              <div className="profile-posts">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Award size={24} />
                  {isOwnProfile
                    ? `הפוסטים שלי (${userPosts.length})`
                    : `פוסטים (${userPosts.length})`}
                </h2>

                {userPosts.length === 0 ? (
                  <div className="profile-empty-posts">
                    <div className="profile-empty-icon">📝</div>
                    <h3 className="text-lg font-semibold mb-2">
                      {isOwnProfile
                        ? "עדיין לא פרסמת פוסטים"
                        : "המשתמש עדיין לא פרסם פוסטים"}
                    </h3>
                    {isOwnProfile && (
                      <>
                        <p className="text-gray-500 mb-4">
                          החל לשתף את המחשבות שלך על הכדורגל!
                        </p>
                        <button
                          className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: colors.primary }}
                          onClick={() => (window.location.href = "/home")}
                        >
                          צור פוסט ראשון
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <PostList
                    initialPosts={userPosts}
                    colors={colors}
                    showCreateButton={false}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default Profile;
