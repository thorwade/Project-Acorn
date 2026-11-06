import React, { useEffect, useMemo, useState } from "react";
import CirclesJourney from "./CirclesJourney.jsx";
import AccountProfile from "./AccountProfile.jsx";
import AppChrome from "./components/AppChrome.jsx";
import { HoldingPage, InstallPage } from "./pages/StaticPages.jsx";
import { HomePage, PlanningPage, TodosPage } from "./pages/PlanningPages.jsx";
import { DiaryPage, GalleryPage } from "./pages/MediaPages.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import { spaceLabel } from "./app-helpers.mjs";
import { diaryMemberIds, diaryCategories, diaryMatchesSpace } from "./diary.mjs";
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

export default function App() {
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [activePage, setActivePage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [space, setSpace] = useState("all");
  const [childName, setChildName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignees, setTaskAssignees] = useState(["family"]);
  const [diaryTitle, setDiaryTitle] = useState("");
  const [diaryBody, setDiaryBody] = useState("");
  const [diaryAssignees, setDiaryAssignees] = useState(["family"]);
  const [educationalCategories, setEducationalCategories] = useState([]);
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
    () => tasks.filter((task) => diaryMatchesSpace(task, space)),
    [space, tasks],
  );
  const visibleDiary = useMemo(
    () => diaryEntries.filter((entry) => diaryMatchesSpace(entry, space)),
    [space, diaryEntries],
  );
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
      setRecords([]);
      setRecordsLoading(Boolean(nextUser));
      setUser(nextUser);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!db || !user) {
      setRecords([]);
      setRecordsLoading(false);
      return undefined;
    }
    setRecordsLoading(true);
    const taskQuery = query(collection(db, "users", user.uid, "tasks"), orderBy("createdAt", "desc"));
    return onSnapshot(
      taskQuery,
      (snapshot) => {
        setRecordsLoading(false);
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
                  createdAtMs: typeof data.createdAt?.toMillis === "function" ? data.createdAt.toMillis() : null,
                  entryDate: typeof data.entryDate === "string" ? data.entryDate : "",
                  assigneeId: String(data.assigneeId ?? "family"),
                  assigneeIds: diaryMemberIds(data),
                  educationalCategories: diaryCategories(data),
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
              if (kind === "report") {
                return {
                  id: entry.id, kind, title: String(data.title || "Learning report"),
                  from: String(data.from || ""), to: String(data.to || ""),
                  reportJson: String(data.reportJson || ""), pdfBase64: String(data.pdfBase64 || ""),
                  createdLabel: formatDate(data.createdAt),
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
                assigneeIds: diaryMemberIds(data),
              };
            })
            .filter((record) => record.kind !== "task" || record.title),
        );
        setError("");
      },
      () => {
        setRecordsLoading(false);
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
    if (taskAssignees.length === 0) {
      setError("Select at least one family member or Whole family.");
      return;
    }
    try {
    await addDoc(collection(db, "users", user.uid, "tasks"), {
      kind: "task",
      title,
      complete: false,
      assigneeId: taskAssignees[0],
      assigneeIds: taskAssignees,
      createdAt: serverTimestamp(),
    });
    setTaskTitle("");
    setSuccess("Task added.");
    setError("");
    } catch {
      setError("Could not save the task. Please try again.");
    }
  }

  async function saveDiary(event) {
    event.preventDefault();
    const title = diaryTitle.trim();
    const body = diaryBody.trim();
    if ((!title && !body && diaryFiles.length === 0) || !db || !user) return;
    if (diaryAssignees.length === 0) {
      setError("Select at least one family member or Whole family.");
      return;
    }
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
        assigneeId: diaryAssignees[0],
        assigneeIds: diaryAssignees,
        educationalCategories,
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
      setDiaryFiles([]);
      setDiaryProgress({});
      setEducationalCategories([]);
      setSuccess(`Diary entry saved${attachments.length > 0 ? " with private attachments." : "."}`);
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
    setTaskAssignees(current => {
      const remaining = current.filter(id => id !== child.id);
      return remaining.length ? remaining : ["family"];
    });
    setDiaryAssignees(current => {
      const remaining = current.filter(id => id !== child.id);
      return remaining.length ? remaining : ["family"];
    });
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

  return (
    <main data-page={activePage} className={`app-shell ${theme === "dark" ? "theme-dark" : ""}`}>
      <AppChrome
        activePage={activePage}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        navigate={navigate}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {!isFirebaseConfigured && (
        <section className="notice" role="status">
          Add your Firebase config values to <code>.env.local</code>, then restart the app.
        </section>
      )}
      {error && <section className="notice error" role="alert">{error}</section>}
      {success && <section className="notice success" role="status">{success}</section>}

      {!authLoading && !user && activePage === "home" && (
        <section className="empty-state">Sign in to open your private family hub.</section>
      )}

      <CirclesJourney
        key={user?.uid || "signed-out"}
        page={activePage}
        user={user}
        onNavigate={navigate}
      />

      {activePage === "install" && (
        <InstallPage
          canPrompt={Boolean(installPrompt)}
          isStandalone={standalone}
          onInstall={handleInstall}
        />
      )}

      {!authLoading && !user && activePage === "gallery" && (
        <HoldingPage
          icon={<Image size={24} aria-hidden="true" />}
          kicker="Gallery"
          title="Gallery will gather private evidence"
        >
          <p>Sign in to browse your private family photo evidence in one place.</p>
          <p>Only the signed-in owner can see or manage their Gallery photos.</p>
        </HoldingPage>
      )}

      {activePage === "contact" && (
        <HoldingPage
          icon={<Mail size={24} aria-hidden="true" />}
          kicker="Contact Us"
          title={user ? "Support and contact options will go here" : "Contact options will go here"}
        >
          <p>This page will hold support and feedback options later. It does not send messages yet.</p>
          {user && (
            <p>
              Project Acorn keeps your family content private and does not share diary, task,
              child, or media records through this page.
            </p>
          )}
        </HoldingPage>
      )}

      {!authLoading &&
        !user &&
        ["todos", "diary", "reports", "profile", "planning", "settings"].includes(activePage) && (
          <HoldingPage
            icon={<ShieldCheck size={24} aria-hidden="true" />}
            kicker="Private area"
            title="Sign in to continue"
          >
            <p>This section uses your private Project Acorn family records. Sign in with Google to open it.</p>
          </HoldingPage>
        )}

      {user && (
        <>
          {activePage === "home" && (
            <HomePage openTaskCount={openTaskCount} diaryCount={visibleDiary.length} />
          )}

          {activePage === "planning" && (
            <PlanningPage
              space={space}
              setSpace={setSpace}
              allChildren={allChildren}
              activeChildren={activeChildren}
              openTaskCount={openTaskCount}
              diaryCount={visibleDiary.length}
            />
          )}

          {activePage === "todos" && (
            <TodosPage
              allChildren={allChildren}
              activeChildren={activeChildren}
              taskTitle={taskTitle}
              setTaskTitle={setTaskTitle}
              taskAssignees={taskAssignees}
              setTaskAssignees={setTaskAssignees}
              signedInMember={{ id: user.uid, name: user.displayName || "Me" }}
              addTask={addTask}
              visibleTasks={tasks}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
            />
          )}

          {activePage === "diary" && (
            <DiaryPage
              allChildren={allChildren}
              activeChildren={activeChildren}
              diaryTitle={diaryTitle}
              setDiaryTitle={setDiaryTitle}
              diaryBody={diaryBody}
              setDiaryBody={setDiaryBody}
              diaryAssignees={diaryAssignees}
              setDiaryAssignees={setDiaryAssignees}
              educationalCategories={educationalCategories}
              setEducationalCategories={setEducationalCategories}
              signedInMember={{ id: user.uid, name: user.displayName || "Me" }}
              diaryFiles={diaryFiles}
              diaryProgress={diaryProgress}
              onDiaryFileChange={onDiaryFileChange}
              saveDiary={saveDiary}
              savingDiary={savingDiary}
              previewUrl={previewUrl}
              previewType={previewType}
              visibleDiary={diaryEntries}
              previewMedia={previewMedia}
              removeAttachment={removeAttachment}
            />
          )}

          {activePage === "gallery" && (
            <GalleryPage
              galleryFiles={galleryFiles}
              galleryProgress={galleryProgress}
              onGalleryFileChange={onGalleryFileChange}
              addGalleryPhotos={addGalleryPhotos}
              savingGallery={savingGallery}
              previewUrl={previewUrl}
              previewType={previewType}
              galleryTiles={galleryTiles}
              previewMedia={previewMedia}
              removeGalleryItem={removeGalleryItem}
            />
          )}

          {activePage === "reports" && (
            <ReportsPage
              key={user.uid}
              user={user}
              entries={diaryEntries}
              members={[{ id: user.uid, name: user.displayName || "Me" }, ...allChildren]}
              savedReports={records.filter(record => record.kind === "report")}
              loading={recordsLoading}
            />
          )}

          {activePage === "profile" && (
            <AccountProfile
              user={user}
              onSignOut={handleSignOut}
              onSettings={() => navigate("settings")}
            />
          )}

          {activePage === "settings" && (
            <SettingsPage
              space={space}
              setSpace={setSpace}
              activeChildren={activeChildren}
              archivedChildren={archivedChildren}
              childName={childName}
              setChildName={setChildName}
              addChild={addChild}
              archiveChild={archiveChild}
              restoreChild={restoreChild}
              theme={theme}
              setAppearance={setAppearance}
            />
          )}
        </>
      )}
    </main>
  );
}
