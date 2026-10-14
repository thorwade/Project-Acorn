import DiaryDateFilters from './DiaryDateFilters.jsx';
import { todayDate, validDiaryDate, diaryDate, dateLabel, sortDiary, inDiaryDateRange } from './diary-dates.mjs';
import { normalizeMembers, diaryInSpace, memberLabel, removeMember } from './diary-members.mjs';
import DiarySubjects from './DiarySubjects.jsx';
import DiaryForm from './DiaryForm.jsx';
import { normalizeSubjects } from './diary-subjects.mjs';
import React, { useEffect, useMemo, useState } from "react";
import CirclesJourney from "./CirclesJourney.jsx";
import AccountProfile, { AccountAvatar } from "./AccountProfile.jsx";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Image,
  Leaf,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Plus,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  UserRound,
  Users,
  Video,
  X,
  Download,
  Mail,
  NotebookPen,
  ListTodo,
  Eye,
} from "lucide-react";
import {
  addDoc,
  auth,
  collection,
  db,
  deleteDoc,
  deleteObject,
  doc,
  getBlob,
  googleProvider,
  isFirebaseConfigured,
  onAuthStateChanged,
  onSnapshot,
  orderBy,
  query,
  ref,
  serverTimestamp,
  setDoc,
  signInWithPopup,
  signOut,
  storage,
  updateDoc,
  uploadBytesResumable,
} from "./firebase";

const CHILD_COLOURS = ["#6c9a8b", "#d99058", "#879ac4", "#c97970", "#8f9862"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const PREFERENCES_ID = "app-preferences";

function initialTheme() {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem("project-acorn-appearance") === "dark"
    ? "dark"
    : "light";
}

function formatDate(value) {
  return value && typeof value.toDate === "function"
    ? value.toDate().toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";
}

function spaceLabel(id, children) {
  if (id === "all") return "All spaces";
  if (id === "family") return "Whole family";
  return children.find((child) => child.id === id)?.name ?? "Child";
}

function formatBytes(size) {
  return size >= 1024 * 1024
    ? `${(size / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
}

function authErrorMessage(error) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  if (code === "auth/unauthorized-domain") {
    return "Google sign-in is blocked for this address. Use the hosted Project Acorn link or add this address as an authorized domain in Firebase Authentication.";
  }
  if (code === "auth/popup-blocked") {
    return "The browser blocked the Google sign-in popup. Allow popups for this site and try again.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "The Google sign-in window was closed before sign-in finished.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Google sign-in is not enabled in Firebase Authentication.";
  }
  return code ? `Google sign-in did not complete. Firebase reported: ${code}.` : "Google sign-in did not complete.";
}

function storageErrorMessage(error) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  if (code === "storage/unauthorized") {
    return "Storage blocked the file action. Check that Firebase Storage is enabled and private rules are deployed.";
  }
  return code ? `Storage action failed. Firebase reported: ${code}.` : "Storage action failed.";
}

function validateDiaryFile(file) {
  const isImage = IMAGE_TYPES.includes(file.type);
  const isVideo = VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo) return "Use JPEG, PNG, WebP, GIF, MP4, WebM, or MOV files only.";
  if (isImage && file.size > MAX_IMAGE_SIZE) return "Images must be 8 MB or smaller.";
  if (isVideo && file.size > MAX_VIDEO_SIZE) return "Videos must be 50 MB or smaller.";
  return "";
}

function validateGalleryFile(file) {
  if (!IMAGE_TYPES.includes(file.type)) return "Use JPEG, PNG, WebP, or GIF photos only.";
  if (file.size > MAX_IMAGE_SIZE) return "Gallery photos must be 8 MB or smaller.";
  return "";
}

function safeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function HoldingPage({ icon, kicker, title, children }) {
  return (
    <section className="panel page-panel holding-page">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h2>{title}</h2>
        </div>
        {icon}
      </div>
      <div className="holding-copy">{children}</div>
    </section>
  );
}

function InstallPanel({ canPrompt, isStandalone, onInstall }) {
  return (
    <div className="install-grid">
      {isStandalone && (
        <div className="notice success" role="status">
          Project Acorn is already running like an installed app on this device.
        </div>
      )}
      <article className="install-card">
        <span className="feature-icon">
          <Download size={24} aria-hidden="true" />
        </span>
        <h3>Android</h3>
        <p>
          On Chrome for Android, tap the install button when it appears. If the browser does not show it yet, open the
          Chrome menu and choose <strong> Install app</strong> or <strong>Add to Home screen</strong>.
        </p>
        <button className="primary-action" type="button" onClick={onInstall}>
          <Download size={18} aria-hidden="true" />
          {canPrompt ? "Install on this device" : "Show install guidance"}
        </button>
      </article>
      <article className="install-card">
        <span className="feature-icon">
          <Upload size={24} aria-hidden="true" />
        </span>
        <h3>iPhone</h3>
        <p>
          In Safari, tap the Share button, then choose <strong>Add to Home Screen</strong>. This installs Project Acorn
          as a home-screen web app. It is not an App Store download.
        </p>
      </article>
      <article className="install-card">
        <span className="feature-icon">
          <ShieldCheck size={24} aria-hidden="true" />
        </span>
        <h3>Offline note</h3>
        <p>
          The app shell can open when your connection is poor, but sign-in, diary uploads, Firestore records, and private
          media still need a secure internet connection.
        </p>
      </article>
    </div>
  );
}

export default function App() {
  const [records, setRecords] = useState([]);
  const [activePage, setActivePage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [space, setSpace] = useState("all");
  const [childName, setChildName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("family");
  const [diaryTitle, setDiaryTitle] = useState("");
  const [diaryBody, setDiaryBody] = useState("");
  const [diarySubjects, setDiarySubjects] = useState([]);
  const [diaryFrom, setDiaryFrom] = useState("");
  const [diaryTo, setDiaryTo] = useState("");
  const [diaryDateMode, setDiaryDateMode] = useState("today");
  const [selectedDiaryDate, setSelectedDiaryDate] = useState(todayDate);
  const [diaryAssignees, setDiaryAssignees] = useState(["family"]);
  const [diaryFiles, setDiaryFiles] = useState([]);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [diaryProgress, setDiaryProgress] = useState({});
  const [galleryProgress, setGalleryProgress] = useState({});
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewType, setPreviewType] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [savingDiary, setSavingDiary] = useState(false);
  const [savingGallery, setSavingGallery] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [standalone, setStandalone] = useState(false);
  const [theme, setTheme] = useState(initialTheme);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const allChildren = useMemo(() => records.filter((record) => record.kind === "child"), [records]);
  const activeChildren = useMemo(() => allChildren.filter((child) => !child.archived), [allChildren]);
  const archivedChildren = useMemo(() => allChildren.filter((child) => child.archived), [allChildren]);
  const tasks = useMemo(() => records.filter((record) => record.kind === "task"), [records]);
  const diaryEntries = useMemo(() => records.filter((record) => record.kind === "diary"), [records]);
  const galleryItems = useMemo(() => records.filter((record) => record.kind === "gallery"), [records]);
  const preferences = useMemo(() => records.find((record) => record.kind === "preferences"), [records]);
  const visibleTasks = useMemo(
    () => tasks.filter((task) => space === "all" || task.assigneeId === space),
    [space, tasks],
  );
  const visibleDiary = useMemo(
    () => sortDiary(diaryEntries.filter((entry) => diaryInSpace(entry, space))),
    [space, diaryEntries],
  );
  const datedDiary = useMemo(() => visibleDiary.filter(entry => inDiaryDateRange(entry, diaryFrom, diaryTo)), [visibleDiary, diaryFrom, diaryTo]);
  const galleryTiles = useMemo(() => {
    const directPhotos = galleryItems.map((item) => ({ ...item, source: "gallery" }));
    const diaryPhotos = diaryEntries.flatMap((entry) =>
      entry.attachments
        .filter((attachment) => attachment.type.startsWith("image/"))
        .map((attachment) => ({
          ...attachment,
          id: `${entry.id}-${attachment.id}`,
          createdLabel: entry.createdLabel,
          source: "diary",
          diaryTitle: entry.title,
          diaryId: entry.id,
        })),
    );
    return [...directPhotos, ...diaryPhotos];
  }, [diaryEntries, galleryItems]);
  const openTaskCount = visibleTasks.filter((task) => !task.complete).length;

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return undefined;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!db || !user) {
      setRecords([]);
      return undefined;
    }
    const taskQuery = query(collection(db, "users", user.uid, "tasks"), orderBy("createdAt", "desc"));
    return onSnapshot(
      taskQuery,
      (snapshot) => {
        setRecords(
          snapshot.docs
            .map((entry) => {
              const data = entry.data();
              const kind = data.kind ?? "task";
              if (kind === "child") {
                return {
                  id: entry.id,
                  kind,
                  name: String(data.name ?? "Child"),
                  colour: String(data.colour ?? CHILD_COLOURS[0]),
                  archived: Boolean(data.archived),
                };
              }
              if (kind === "diary") {
                return {
                  id: entry.id,
                  kind,
                  title: String(data.title ?? "Diary note"),
                  body: String(data.body ?? ""),
                  subjects: normalizeSubjects(data.subjects),
                  entryDate: diaryDate(data.entryDate, data.createdAt),
                  createdMillis: data.createdAt?.toMillis?.() || 0,
                  assigneeIds: normalizeMembers(data.assigneeIds, data.assigneeId),
                  assigneeId: String(data.assigneeId ?? "family"),
                  createdLabel: formatDate(data.createdAt),
                  attachments: Array.isArray(data.attachments)
                    ? data.attachments.map((attachment) => ({
                        id: String(attachment.id ?? ""),
                        name: String(attachment.name ?? "Attachment"),
                        path: String(attachment.path ?? ""),
                        size: Number(attachment.size ?? 0),
                        type: String(attachment.type ?? ""),
                      }))
                    : [],
                };
              }
              if (kind === "gallery") {
                return {
                  id: entry.id,
                  kind,
                  name: String(data.name ?? "Gallery photo"),
                  path: String(data.path ?? ""),
                  size: Number(data.size ?? 0),
                  type: String(data.type ?? ""),
                  createdLabel: formatDate(data.createdAt),
                };
              }
              if (kind === "preferences") {
                return {
                  id: entry.id,
                  kind,
                  appearance: data.appearance === "dark" ? "dark" : "light",
                };
              }
              return {
                id: entry.id,
                kind: "task",
                title: String(data.title ?? ""),
                complete: Boolean(data.complete),
                assigneeId: String(data.assigneeId ?? "family"),
              };
            })
            .filter((record) => record.kind !== "task" || record.title),
        );
        setError("");
      },
      () => {
        setError("Could not load the hub. Check Firebase rules for this family space.");
      },
    );
  }, [user]);

  useEffect(() => {
    if (preferences) setTheme(preferences.appearance);
  }, [preferences]);

  useEffect(() => {
    window.localStorage.setItem("project-acorn-appearance", theme);
  }, [theme]);

  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || Boolean(window.navigator.standalone));
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setStandalone(true);
      setSuccess("Project Acorn is installed on this device.");
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  async function handleSignIn() {
    if (!auth) {
      setError("Firebase is not configured yet.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      setSuccess("Signed in. Your family hub is private to this account.");
      setMenuOpen(false);
      setError("");
    } catch (signInError) {
      setError(authErrorMessage(signInError));
    }
  }

  async function handleSignOut() {
    if (!auth) return;
    await signOut(auth);
    setMenuOpen(false);
    setSuccess("");
  }

  async function handleInstall() {
    if (!installPrompt) {
      setSuccess("Use your browser menu to add Project Acorn to your home screen.");
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setSuccess(choice.outcome === "accepted" ? "Project Acorn is installing." : "Install was cancelled. You can try again from this page.");
  }

  async function setAppearance(nextTheme) {
    setTheme(nextTheme);
    if (!db || !user) return;
    await setDoc(
      doc(db, "users", user.uid, "tasks", PREFERENCES_ID),
      { kind: "preferences", appearance: nextTheme, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
      { merge: true },
    );
    setSuccess(nextTheme === "dark" ? "Dark theme is on for your account." : "Light theme is on for your account.");
  }

  function onDiaryFileChange(fileList) {
    if (!fileList) {
      setDiaryFiles([]);
      return;
    }
    const files = Array.from(fileList);
    const invalid = files.map(validateDiaryFile).find(Boolean);
    if (invalid) {
      setDiaryFiles([]);
      setError(invalid);
      return;
    }
    setDiaryFiles(files);
    setError("");
  }

  function onGalleryFileChange(fileList) {
    if (!fileList) {
      setGalleryFiles([]);
      return;
    }
    const files = Array.from(fileList);
    const invalid = files.map(validateGalleryFile).find(Boolean);
    if (invalid) {
      setGalleryFiles([]);
      setError(invalid);
      return;
    }
    setGalleryFiles(files);
    setError("");
  }

  async function addChild(event) {
    event.preventDefault();
    const name = childName.trim();
    if (!name || !db || !user) return;
    const colour = CHILD_COLOURS[activeChildren.length % CHILD_COLOURS.length];
    const childRef = await addDoc(collection(db, "users", user.uid, "tasks"), {
      kind: "child",
      name,
      colour,
      archived: false,
      createdAt: serverTimestamp(),
    });
    setChildName("");
    setSpace(childRef.id);
    setSuccess(`${name}'s space was added.`);
  }

  async function addTask(event) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title || !db || !user) return;
    await addDoc(collection(db, "users", user.uid, "tasks"), {
      kind: "task",
      title,
      complete: false,
      assigneeId: taskAssignee,
      createdAt: serverTimestamp(),
    });
    setTaskTitle("");
    setSuccess(`Task added for ${spaceLabel(taskAssignee, allChildren)}.`);
  }

  async function saveDiarySubjects(id, subjects) {
    if (!db || !user) throw new Error('Sign in to save subjects.');
    await updateDoc(doc(db, "users", user.uid, "tasks", id), { subjects: normalizeSubjects(subjects) });
  }

  async function saveDiary(event) {
    event.preventDefault();
    const title = diaryTitle.trim();
    const body = diaryBody.trim();
    if ((!title && !body && diaryFiles.length === 0) || !db || !user) return;
    const entryDate = diaryDateMode === "today" ? todayDate() : new FormData(event.currentTarget).get("entryDate");
    if (!validDiaryDate(entryDate)) { setError("Choose a valid diary date."); return; }
    if (diaryFiles.some(validateDiaryFile)) {
      setError("One or more attachments do not meet the file rules.");
      return;
    }
    setSavingDiary(true);
    setDiaryProgress({});
    try {
      const diaryRef = await addDoc(collection(db, "users", user.uid, "tasks"), {
        kind: "diary",
        title: title || "Learning note",
        body,
        assigneeIds: normalizeMembers(diaryAssignees),
        subjects: normalizeSubjects(diarySubjects),
        entryDate,
        attachments: [],
        createdAt: serverTimestamp(),
      });
      const attachments = [];
      for (const file of diaryFiles) {
        if (!storage) throw new Error("storage/not-configured");
        const fileId = crypto.randomUUID();
        const path = `users/${user.uid}/diary/${diaryRef.id}/${fileId}-${safeFileName(file.name)}`;
        const fileRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(fileRef, file, {
          contentType: file.type,
          customMetadata: { ownerId: user.uid, diaryId: diaryRef.id },
        });
        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setDiaryProgress((current) => ({ ...current, [fileId]: percent }));
            },
            reject,
            resolve,
          );
        });
        attachments.push({ id: fileId, name: file.name, path, size: file.size, type: file.type });
      }
      if (attachments.length > 0) {
        await updateDoc(doc(db, "users", user.uid, "tasks", diaryRef.id), { attachments });
      }
      setDiaryTitle("");
      setDiaryBody("");
      setDiarySubjects([]);
      setDiaryDateMode("today");
      setSelectedDiaryDate(todayDate());
      setDiaryFiles([]);
      setDiaryProgress({});
      setSuccess(`Diary entry saved for ${memberLabel(diaryAssignees, allChildren)}${attachments.length > 0 ? " with private attachments." : "."}`);
      setError("");
    } catch (saveError) {
      setError(storageErrorMessage(saveError));
    } finally {
      setSavingDiary(false);
    }
  }

  async function addGalleryPhotos(event) {
    event.preventDefault();
    if (galleryFiles.length === 0 || !db || !storage || !user) return;
    if (galleryFiles.some(validateGalleryFile)) {
      setError("One or more gallery photos do not meet the file rules.");
      return;
    }
    setSavingGallery(true);
    setGalleryProgress({});
    try {
      for (const file of galleryFiles) {
        const fileId = crypto.randomUUID();
        const path = `users/${user.uid}/gallery/${fileId}-${safeFileName(file.name)}`;
        const fileRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(fileRef, file, {
          contentType: file.type,
          customMetadata: { ownerId: user.uid, source: "gallery" },
        });
        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setGalleryProgress((current) => ({ ...current, [fileId]: percent }));
            },
            reject,
            resolve,
          );
        });
        await addDoc(collection(db, "users", user.uid, "tasks"), {
          kind: "gallery",
          name: file.name,
          path,
          size: file.size,
          type: file.type,
          createdAt: serverTimestamp(),
        });
      }
      setGalleryFiles([]);
      setGalleryProgress({});
      setSuccess(galleryFiles.length === 1 ? "Photo added to your private Gallery." : `${galleryFiles.length} photos added to your private Gallery.`);
      setError("");
    } catch (galleryError) {
      setError(storageErrorMessage(galleryError));
    } finally {
      setSavingGallery(false);
    }
  }

  async function previewMedia(item) {
    if (!storage) {
      setError("Firebase Storage is not configured yet.");
      return;
    }
    try {
      const blob = await getBlob(ref(storage, item.path));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewType(item.type);
      setError("");
    } catch (previewError) {
      setError(storageErrorMessage(previewError));
    }
  }

  async function removeAttachment(entry, attachment) {
    if (!storage || !db || !user) return;
    try {
      await deleteObject(ref(storage, attachment.path));
      await updateDoc(doc(db, "users", user.uid, "tasks", entry.id), {
        attachments: entry.attachments.filter((item) => item.id !== attachment.id),
      });
      setSuccess("Attachment removed.");
      setError("");
    } catch (removeError) {
      setError(storageErrorMessage(removeError));
    }
  }

  async function removeGalleryItem(item) {
    if (item.source !== "gallery" || !storage || !db || !user) return;
    try {
      await deleteObject(ref(storage, item.path));
      await deleteDoc(doc(db, "users", user.uid, "tasks", item.id));
      setSuccess("Photo removed from your private Gallery.");
      setError("");
    } catch (removeError) {
      setError(storageErrorMessage(removeError));
    }
  }

  async function archiveChild(child) {
    if (!db || !user) return;
    if (!window.confirm(`Remove ${child.name} from the active family list? Their existing tasks, diary entries, and media will stay private and can be restored later.`)) return;
    await updateDoc(doc(db, "users", user.uid, "tasks", child.id), { archived: true });
    if (space === child.id) setSpace("all");
    if (taskAssignee === child.id) setTaskAssignee("family");
    if (diaryAssignees.includes(child.id)) setDiaryAssignees(removeMember(diaryAssignees, child.id));
    setSuccess(`${child.name} was moved to archived family members.`);
  }

  async function restoreChild(child) {
    if (!db || !user) return;
    await updateDoc(doc(db, "users", user.uid, "tasks", child.id), { archived: false });
    setSuccess(`${child.name} was restored to the active family list.`);
  }

  async function toggleTask(task) {
    if (!db || !user) return;
    await updateDoc(doc(db, "users", user.uid, "tasks", task.id), { complete: !task.complete });
  }

  async function deleteTask(id) {
    if (!db || !user) return;
    await deleteDoc(doc(db, "users", user.uid, "tasks", id));
  }

  function navigate(page) {
    setActivePage(page);
    setMenuOpen(false);
  }

  const spaceTabs = (
    <div className="space-tabs" aria-label="Select family or child space">
      <button className={space === "all" ? "space-tab active" : "space-tab"} type="button" onClick={() => setSpace("all")}>
        <Users size={16} aria-hidden="true" />
        All
      </button>
      <button className={space === "family" ? "space-tab active" : "space-tab"} type="button" onClick={() => setSpace("family")}>
        <UserRound size={16} aria-hidden="true" />
        Family
      </button>
      {activeChildren.map((child) => (
        <button className={space === child.id ? "space-tab active" : "space-tab"} type="button" onClick={() => setSpace(child.id)} key={child.id}>
          <span className="child-dot" style={{ backgroundColor: child.colour }} />
          {child.name}
        </button>
      ))}
    </div>
  );

  const bottomNav = [
    { id: "home", label: "Home", icon: <Users size={22} aria-hidden="true" /> },
    { id: "events", label: "Events", icon: <CalendarDays size={22} aria-hidden="true" /> },
    { id: "circles", label: "Circles", icon: <Users size={22} aria-hidden="true" /> },
    { id: "todos", label: "To-do", icon: <ListTodo size={22} aria-hidden="true" /> },
    { id: "diary", label: "Diary", icon: <NotebookPen size={22} aria-hidden="true" /> },
  ];

  const menuItems = [
    { id: "home", label: "Home", icon: <Users size={18} aria-hidden="true" /> },
    { id: "events", label: "Events", icon: <CalendarDays size={18} aria-hidden="true" /> },
    { id: "circles", label: "Circles", icon: <Users size={18} aria-hidden="true" /> },
    { id: "todos", label: "To-do List", icon: <ListTodo size={18} aria-hidden="true" /> },
    { id: "profile", label: "Profile", icon: <UserRound size={18} aria-hidden="true" /> },
    { id: "diary", label: "Diary", icon: <NotebookPen size={18} aria-hidden="true" /> },
    { id: "gallery", label: "Gallery", icon: <Image size={18} aria-hidden="true" /> },
    { id: "planning", label: "Planning", icon: <CalendarDays size={18} aria-hidden="true" /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} aria-hidden="true" /> },
    { id: "contact", label: "Contact Us", icon: <Mail size={18} aria-hidden="true" /> },
    { id: "install", label: "Install App", icon: <Download size={18} aria-hidden="true" /> },
  ];

  return (
    <main data-page={activePage} className={`app-shell ${theme === "dark" ? "theme-dark" : ""}`}>
      <header className="app-header">
        <button className="menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Open menu">
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
        <span className="brand-lockup">
          <span className="acorn-mark" aria-hidden="true">
            <Leaf size={18} />
          </span>
          Acorn
        </span>
      </header>

      {menuOpen && (
        <aside className="menu-panel" aria-label="Menu">
          <div className="menu-hero">
            <span className="acorn-mark large" aria-hidden="true">
              <Leaf size={28} />
            </span>
            <strong>Acorn</strong>
            <span>Private family learning hub</span>
          </div>
          {menuItems.map((item) => (
            <button className={activePage === item.id ? "active" : ""} type="button" onClick={() => navigate(item.id)} key={item.id}>
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="menu-account">
            <span>{user ? `Signed in as ${user.displayName || user.email || "your account"}` : "Account"}</span>
            {user ? (
              <button type="button" onClick={handleSignOut}>
                <LogOut size={18} aria-hidden="true" />
                Sign out
              </button>
            ) : (
              <button type="button" onClick={handleSignIn}>
                <LogIn size={18} aria-hidden="true" />
                Sign in with Google
              </button>
            )}
          </div>
          {user && (
            <button className="mobile-menu-signout" type="button" onClick={handleSignOut}>
              <LogOut size={18} aria-hidden="true" />
              Sign out
            </button>
          )}
        </aside>
      )}

      <section className="hero-panel">
        <div>
          <p className="eyebrow">
            <span className="acorn-mark mini" aria-hidden="true">
              <Leaf size={14} />
            </span>
            Project Acorn
          </p>
          <h1>Home Education Hub</h1>
          <p className="hero-copy">
            Plan the week, capture learning moments, and keep each child's journey private in one calm family space.
          </p>
          <p className="hero-tagline">Creating for home education by home educators</p>
        </div>
        {!user && (
          <button className="secondary-action" type="button" onClick={handleSignIn}>
            <LogIn size={18} aria-hidden="true" />
            Sign in with Google
          </button>
        )}
        {user && (
          <button className="secondary-action account-shortcut" type="button" onClick={() => navigate("profile")} aria-label="View signed-in profile">
            <AccountAvatar user={user} />
            <span>{user.displayName || user.email || "Your account"}</span>
          </button>
        )}
      </section>

      <nav className="bottom-nav" aria-label="Primary sections">
        {bottomNav.map((item) => (
          <button className={activePage === item.id ? "active" : ""} type="button" onClick={() => navigate(item.id)} key={item.id}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {!isFirebaseConfigured && (
        <section className="notice" role="status">
          Add your Firebase config values to `.env.local`, then restart the app.
        </section>
      )}
      {error && (
        <section className="notice error" role="alert">
          {error}
        </section>
      )}
      {success && (
        <section className="notice success" role="status">
          {success}
        </section>
      )}

      {!authLoading && !user && activePage === "home" && (
        <section className="empty-state">Sign in to open your private family hub.</section>
      )}

      <CirclesJourney key={user?.uid || 'signed-out'} page={activePage} user={user} onNavigate={navigate} />

      {!authLoading && !user && activePage === "gallery" && (
        <HoldingPage icon={<Image size={24} aria-hidden="true" />} kicker="Gallery" title="Gallery will gather private evidence">
          <p>Sign in to browse your private family photo evidence in one place.</p>
          <p>Only the signed-in owner can see or manage their Gallery photos.</p>
        </HoldingPage>
      )}

      {!authLoading && !user && activePage === "contact" && (
        <HoldingPage icon={<Mail size={24} aria-hidden="true" />} kicker="Contact Us" title="Contact options will go here">
          <p>This page will hold support and feedback options later. It does not send messages yet.</p>
        </HoldingPage>
      )}

      {!authLoading && !user && activePage === "install" && (
        <section className="panel page-panel install-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Install</p>
              <h2>Add Project Acorn to your phone</h2>
            </div>
            <Download size={24} aria-hidden="true" />
          </div>
          <InstallPanel canPrompt={Boolean(installPrompt)} isStandalone={standalone} onInstall={handleInstall} />
        </section>
      )}

      {!authLoading && !user && ["todos", "diary", "profile", "planning", "settings"].includes(activePage) && (
        <HoldingPage icon={<ShieldCheck size={24} aria-hidden="true" />} kicker="Private area" title="Sign in to continue">
          <p>This section uses your private Project Acorn family records. Sign in with Google to open it.</p>
        </HoldingPage>
      )}

      {user && (
        <>
          {activePage === "home" && (
            <section className="home-grid">
              <article className="feature-card lavender">
                <span className="feature-icon">
                  <CalendarDays size={24} aria-hidden="true" />
                </span>
                <p className="section-kicker">Today</p>
                <h2>Family rhythm</h2>
                <p>Choose a child or the whole family, then move into Planning, To-do, or Diary to organise the day.</p>
              </article>
              <article className="feature-card green">
                <span className="feature-icon">
                  <ListTodo size={24} aria-hidden="true" />
                </span>
                <p className="section-kicker">To-do</p>
                <h2>{openTaskCount} open tasks</h2>
                <p>Tasks stay private and can be assigned to the family or an individual child.</p>
              </article>
              <article className="feature-card peach">
                <span className="feature-icon">
                  <NotebookPen size={24} aria-hidden="true" />
                </span>
                <p className="section-kicker">Diary</p>
                <h2>{visibleDiary.length} diary notes</h2>
                <p>Capture evidence with text, photos, or videos in your private learning diary.</p>
              </article>
            </section>
          )}

          {activePage === "install" && (
            <section className="panel page-panel install-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">Install</p>
                  <h2>Add Project Acorn to your phone</h2>
                </div>
                <Download size={24} aria-hidden="true" />
              </div>
              <InstallPanel canPrompt={Boolean(installPrompt)} isStandalone={standalone} onInstall={handleInstall} />
            </section>
          )}

          {activePage === "planning" && (
            <section className="panel page-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">Planning</p>
                  <h2>{spaceLabel(space, allChildren)} overview</h2>
                </div>
                <CalendarDays size={22} aria-hidden="true" />
              </div>
              {spaceTabs}
              <div className="planning-grid">
                <article>
                  <strong>{openTaskCount}</strong>
                  <span>open tasks in this space</span>
                </article>
                <article>
                  <strong>{visibleDiary.length}</strong>
                  <span>diary notes captured</span>
                </article>
                <article>
                  <strong>{activeChildren.length}</strong>
                  <span>child spaces in the family hub</span>
                </article>
              </div>
              <p className="planning-note">Use Planning to choose the family or child context, then move to To-dos or Diary to add work and evidence for that space.</p>
            </section>
          )}

          {activePage === "todos" && (
            <section className="panel page-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">To-dos</p>
                  <h2>{spaceLabel(space, allChildren)} tasks</h2>
                </div>
                <ListTodo size={22} aria-hidden="true" />
              </div>
              {spaceTabs}
              <form className="stacked-form" onSubmit={addTask}>
                <label htmlFor="task-title">Task</label>
                <input id="task-title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Reading, nature walk, maths practice..." />
                <label htmlFor="task-assignee">For</label>
                <select id="task-assignee" value={taskAssignee} onChange={(event) => setTaskAssignee(event.target.value)}>
                  <option value="family">Whole family</option>
                  {activeChildren.map((child) => (
                    <option value={child.id} key={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
                <button className="primary-action" type="submit">
                  <Plus size={18} aria-hidden="true" />
                  Add task
                </button>
              </form>
              <div className="item-list" aria-label="Tasks">
                {visibleTasks.length === 0 && <p className="empty-state">No tasks in this space yet.</p>}
                {visibleTasks.map((task) => (
                  <article className="list-item" key={task.id}>
                    <button className="icon-button" type="button" onClick={() => toggleTask(task)} aria-label={task.complete ? "Mark task incomplete" : "Mark task done"}>
                      {task.complete ? <CheckCircle2 size={20} aria-hidden="true" /> : <Circle size={20} aria-hidden="true" />}
                    </button>
                    <div>
                      <strong className={task.complete ? "complete" : ""}>{task.title}</strong>
                      <span>{spaceLabel(task.assigneeId, allChildren)}</span>
                    </div>
                    <button className="icon-button subtle" type="button" onClick={() => deleteTask(task.id)} aria-label="Delete task">
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activePage === "diary" && (
            <section className="panel page-panel diary-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">Diary</p>
                  <h2>Learning diary</h2>
                </div>
                <NotebookPen size={22} aria-hidden="true" />
              </div>
              {spaceTabs}
              <DiaryForm
                saveDiary={saveDiary} diaryTitle={diaryTitle} setDiaryTitle={setDiaryTitle}
                diarySubjects={diarySubjects} setDiarySubjects={setDiarySubjects}
                diaryDateMode={diaryDateMode} setDiaryDateMode={setDiaryDateMode}
                selectedDiaryDate={selectedDiaryDate} setSelectedDiaryDate={setSelectedDiaryDate}
                diaryFiles={diaryFiles} onDiaryFileChange={onDiaryFileChange}
                diaryProgress={diaryProgress} savingDiary={savingDiary}
                diaryBody={diaryBody} setDiaryBody={setDiaryBody}
                diaryAssignees={diaryAssignees} setDiaryAssignees={setDiaryAssignees}
                activeChildren={activeChildren} formatBytes={formatBytes}
              />
              {previewUrl && (
                <section className="preview-panel" aria-label="Attachment preview">
                  {previewType.startsWith("image/") ? <img src={previewUrl} alt="Selected diary attachment preview" /> : <video src={previewUrl} controls />}
                </section>
              )}
              <DiaryDateFilters from={diaryFrom} to={diaryTo} setFrom={setDiaryFrom} setTo={setDiaryTo} />
              <div className="item-list diary-list" aria-label="Diary entries">
                {datedDiary.length === 0 && <p className="empty-state">No diary entries match this space and date range.</p>}
                {datedDiary.map((entry) => (
                  <article className="diary-entry" key={entry.id}>
                    <div className="diary-meta">
                      <span>{dateLabel(entry.entryDate)}</span>
                      <span>{memberLabel(entry.assigneeIds, allChildren)}</span>
                    </div>
                    <h3>{entry.title}</h3>
                    {entry.body && <p>{entry.body}</p>}
                    <DiarySubjects entry={entry} onSave={saveDiarySubjects} />
                    {entry.attachments.length > 0 ? (
                      <div className="attachment-list">
                        {entry.attachments.map((attachment) => (
                          <div className="attachment-row" key={attachment.id}>
                            <span>{attachment.name} ({formatBytes(attachment.size)})</span>
                            <button type="button" onClick={() => previewMedia(attachment)}>
                              <Eye size={16} aria-hidden="true" />
                              View
                            </button>
                            <button type="button" onClick={() => removeAttachment(entry, attachment)}>
                              <Trash2 size={16} aria-hidden="true" />
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="attachment-note">No attachments saved for this entry.</div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {activePage === "gallery" && (
            <section className="panel page-panel gallery-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">Gallery</p>
                  <h2>Private photo evidence</h2>
                </div>
                <Image size={22} aria-hidden="true" />
              </div>
              <form className="stacked-form gallery-upload" onSubmit={addGalleryPhotos}>
                <label htmlFor="gallery-photos">Add photos straight to Gallery</label>
                <input id="gallery-photos" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => onGalleryFileChange(event.target.files)} />
                <div className="attachment-strip" aria-label="Gallery photo rules">
                  <span>
                    <Image size={17} aria-hidden="true" />
                    Photos up to 8 MB
                  </span>
                  <span>
                    <ShieldCheck size={17} aria-hidden="true" />
                    Owner-only access
                  </span>
                  <span>
                    <ShieldCheck size={17} aria-hidden="true" />
                    No public links
                  </span>
                </div>
                {galleryFiles.length > 0 && (
                  <div className="selected-files">
                    {galleryFiles.map((file) => (
                      <span key={`${file.name}-${file.size}`}>{file.name} ({formatBytes(file.size)})</span>
                    ))}
                  </div>
                )}
                {Object.entries(galleryProgress).length > 0 && (
                  <div className="upload-progress">
                    {Object.entries(galleryProgress).map(([id, percent]) => (
                      <span key={id}>Uploading photo: {percent}%</span>
                    ))}
                  </div>
                )}
                <button className="primary-action" type="submit" disabled={savingGallery || galleryFiles.length === 0}>
                  {savingGallery ? <Upload size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                  {savingGallery ? "Adding..." : "Add to Gallery"}
                </button>
              </form>
              {previewUrl && (
                <section className="preview-panel" aria-label="Private media preview">
                  {previewType.startsWith("image/") ? <img src={previewUrl} alt="Private gallery preview" /> : <video src={previewUrl} controls />}
                </section>
              )}
              {galleryTiles.length === 0 ? (
                <p className="empty-state">No photos yet. Diary image attachments and direct Gallery uploads will appear here privately.</p>
              ) : (
                <div className="gallery-grid" aria-label="Private Gallery photos">
                  {galleryTiles.map((item) => (
                    <article className="gallery-tile" key={item.id}>
                      <button className="gallery-thumb" type="button" onClick={() => previewMedia(item)}>
                        <Image size={26} aria-hidden="true" />
                        <span>Tap to view</span>
                      </button>
                      <div className="gallery-copy">
                        <span className={item.source === "diary" ? "source-badge diary" : "source-badge"}>{item.source === "diary" ? "From Diary" : "Gallery"}</span>
                        <strong>{item.name}</strong>
                        <span>{item.createdLabel} · {formatBytes(item.size)}</span>
                        {item.diaryTitle && <span>Diary: {item.diaryTitle}</span>}
                      </div>
                      <div className="gallery-actions">
                        <button type="button" onClick={() => previewMedia(item)}>
                          <Eye size={16} aria-hidden="true" />
                          View
                        </button>
                        {item.source === "gallery" ? (
                          <button type="button" onClick={() => removeGalleryItem(item)}>
                            <Trash2 size={16} aria-hidden="true" />
                            Remove
                          </button>
                        ) : (
                          <span>Remove from Diary entry</span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activePage === "profile" && (
            <AccountProfile user={user} onSignOut={handleSignOut} onSettings={() => navigate("settings")} />
          )}

          {activePage === "contact" && (
            <HoldingPage icon={<Mail size={24} aria-hidden="true" />} kicker="Contact Us" title="Support and contact options will go here">
              <p>This is a holding page for future support, feedback, and help options. It does not send messages yet.</p>
              <p>For now, Project Acorn keeps your family content private and does not share diary, task, child, or media records through this page.</p>
            </HoldingPage>
          )}

          {activePage === "settings" && (
            <section className="workspace-grid">
              <div className="panel child-panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-kicker">Settings</p>
                    <h2>Child profiles</h2>
                  </div>
                  <Users size={22} aria-hidden="true" />
                </div>
                {spaceTabs}
                <form className="inline-form" onSubmit={addChild}>
                  <label htmlFor="child-name">Add child</label>
                  <div className="input-row">
                    <input id="child-name" value={childName} onChange={(event) => setChildName(event.target.value)} placeholder="Child's name" />
                    <button type="submit" aria-label="Add child">
                      <Plus size={19} aria-hidden="true" />
                    </button>
                  </div>
                </form>
                <div className="settings-list" aria-label="Active family members">
                  <h3>Active family members</h3>
                  {activeChildren.length === 0 ? (
                    <p className="empty-state">No active child profiles yet.</p>
                  ) : (
                    activeChildren.map((child) => (
                      <article className="settings-row" key={child.id}>
                        <span className="child-dot" style={{ backgroundColor: child.colour }} />
                        <strong>{child.name}</strong>
                        <button type="button" onClick={() => archiveChild(child)} aria-label={`Remove ${child.name} from active family members`}>
                          <Trash2 size={16} aria-hidden="true" />
                          Remove from family
                        </button>
                      </article>
                    ))
                  )}
                </div>
                <div className="settings-list" aria-label="Archived family members">
                  <h3>Archived family members</h3>
                  <p className="settings-note">Archived members are hidden from active selectors, but their existing private history is preserved.</p>
                  {archivedChildren.length === 0 ? (
                    <p className="attachment-note">No archived family members.</p>
                  ) : (
                    archivedChildren.map((child) => (
                      <article className="settings-row archived" key={child.id}>
                        <span className="child-dot" style={{ backgroundColor: child.colour }} />
                        <strong>{child.name}</strong>
                        <button type="button" onClick={() => restoreChild(child)} aria-label={`Restore ${child.name} to active family members`}>
                          <Plus size={16} aria-hidden="true" />
                          Restore
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </div>
              <div className="panel privacy-panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-kicker">Family settings</p>
                    <h2>Private by default</h2>
                  </div>
                  <ShieldCheck size={22} aria-hidden="true" />
                </div>
                <p>
                  Family records and media are stored under the signed-in account. Sharing with local education authorities should be added later with controlled, revocable view-only access.
                </p>
                <div className="appearance-panel" aria-label="Appearance settings">
                  <h3>Appearance</h3>
                  <div className="theme-choice" role="group" aria-label="Choose theme">
                    <button className={theme === "light" ? "active" : ""} type="button" onClick={() => setAppearance("light")}>
                      <Sun size={17} aria-hidden="true" />
                      Light
                    </button>
                    <button className={theme === "dark" ? "active" : ""} type="button" onClick={() => setAppearance("dark")}>
                      <Moon size={17} aria-hidden="true" />
                      Dark
                    </button>
                  </div>
                  <p>This is your personal display preference and does not change the app for other families.</p>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
