"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera, CameraOff, CheckCircle2, Loader2, ScanFace,
  HelpCircle, ShieldCheck, UserPlus, Users,
} from "lucide-react";
import { api } from "@/lib/api";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import { Empty, ErrorBox, InfoBox, Loading } from "@/components/dashboard/DataState";
import { TEACHER_NAV } from "@/lib/teacher-nav";
import FaceApprovalReview from "@/components/dashboard/FaceApprovalReview";

type StudentFace = {
  student_id: number; name: string; email: string; roll_number: string | null;
  enrolled: boolean; samples: number; consent: boolean; pending_approval?: boolean;
};
type SessionRow = { id: number; class_id: number; status: string; starts_at: string };
type ClassRow = { id: number; subject_id: number };
type SubjectRow = { id: number; code: string; name: string };

export default function TeacherFaceRecognitionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<"recognize" | "enroll">("recognize");
  const [students, setStudents] = useState<StudentFace[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [consent, setConsent] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [faceData, sessionData, classData, subjectData] = await Promise.all([
        api<StudentFace[]>("/face/enrollments"), api<SessionRow[]>("/sessions"),
        api<ClassRow[]>("/classes"), api<SubjectRow[]>("/classes/subjects"),
      ]);
      setStudents(faceData);
      setSessions(sessionData);
      setClasses(classData);
      setSubjects(subjectData);
      const open = sessionData.filter((item) => item.status === "open");
      setSessionId((current) => current || String(open[0]?.id || ""));
      setStudentId((current) => current || String(faceData[0]?.student_id || ""));
    } catch (e: any) { setError(e.message || "Failed to load face recognition data"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function startCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access requires a compatible browser and HTTPS or localhost.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setError("Camera permission was denied or no camera is available.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  async function captureBlob(): Promise<Blob> {
    const video = videoRef.current;
    if (!video || !video.videoWidth) throw new Error("Start the camera and wait for the video preview first.");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Camera frame capture is not supported.");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not capture camera frame.")), "image/jpeg", 0.9));
  }

  async function recognize() {
    if (!sessionId) { setError("Create or select an open attendance session first."); return; }
    setBusy(true); setError(""); setNotice(""); setResult(null);
    try {
      const blob = await captureBlob();
      const form = new FormData();
      form.append("session_id", sessionId);
      form.append("mark_attendance", "true");
      form.append("file", blob, "camera-frame.jpg");
      const response = await api("/face/recognize", { method: "POST", body: form });
      setResult(response);
      if (response.matched && response.needs_confirmation) setNotice(`Low-confidence match (${(response.confidence * 100).toFixed(1)}%). Confirm that this is ${response.name} to mark them present.`);
      else if (response.matched && response.already_marked) setNotice(`${response.name} is already marked ${response.status}.`);
      else if (response.matched) setNotice(`${response.name} was marked present. Similarity: ${(response.confidence * 100).toFixed(1)}%.`);
      else setError(response.message || "No confident face match was found.");
    } catch (e: any) { setError(e.message || "Face recognition failed"); }
    finally { setBusy(false); }
  }

  async function confirmMatch() {
    if (!result?.needs_confirmation) return;
    setConfirming(true); setError("");
    try {
      const response = await api("/face/confirm", {
        method: "POST",
        body: JSON.stringify({ session_id: Number(sessionId), student_id: result.student_id, confidence: result.confidence }),
      });
      setResult({ ...result, ...response, needs_confirmation: false });
      setNotice(`${response.name} was confirmed and marked present.`);
    } catch (e: any) { setError(e.message || "Could not confirm this match"); }
    finally { setConfirming(false); }
  }

  async function enroll() {
    if (!studentId) { setError("Select a student to enroll."); return; }
    if (!consent) { setError("Confirm the student's consent before enrollment."); return; }
    setBusy(true); setError(""); setNotice(""); setResult(null);
    try {
      const form = new FormData();
      form.append("student_id", studentId);
      form.append("consent", "true");
      for (let index = 0; index < 3; index += 1) {
        const blob = await captureBlob();
        form.append("files", blob, `enrollment-${index + 1}.jpg`);
        if (index < 2) await new Promise((resolve) => setTimeout(resolve, 450));
      }
      const response = await api("/face/enroll", { method: "POST", body: form });
      setNotice(`${response.name} enrolled with ${response.samples} samples. Only the ${response.dimensions}-value embedding was stored; photos were discarded.`);
      setConsent(false);
      await load();
    } catch (e: any) { setError(e.message || "Face enrollment failed"); }
    finally { setBusy(false); }
  }

  const sessionLabel = (session: SessionRow) => {
    const classItem = classes.find((item) => item.id === session.class_id);
    const subject = subjects.find((item) => item.id === classItem?.subject_id);
    return `Session #${session.id} · ${subject?.code || `Class #${session.class_id}`} · ${new Date(session.starts_at).toLocaleString()}`;
  };

  return (
    <DashboardShell navGroups={TEACHER_NAV} title="Face Recognition" subtitle="OpenCV enrollment and automatic present marking" accent="violet">
      <div className="p-4 lg:p-8 max-w-[1250px] mx-auto space-y-6">
        <PageHeader title="Face Recognition" subtitle="YuNet detects the face; SFace compares its embedding with enrolled students" />
        <InfoBox message="Use one face at a time in good lighting. Recognition requires an open session and only compares students enrolled in that class. This build does not claim liveness or anti-spoofing protection." />
        <ErrorBox message={error} onRetry={load} />
        <InfoBox message={notice} />

        <div className="inline-flex rounded-2xl border border-border p-1 glass-card">
          <button onClick={() => { setMode("recognize"); setResult(null); }} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${mode === "recognize" ? "bg-violet-500/15 text-violet-400" : "text-zinc-400"}`}><ScanFace size={15} className="inline mr-2" />Scan & Mark Present</button>
          <button onClick={() => { setMode("enroll"); setResult(null); }} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${mode === "enroll" ? "bg-violet-500/15 text-violet-400" : "text-zinc-400"}`}><UserPlus size={15} className="inline mr-2" />Enroll Face</button>
        </div>

        {loading ? <Loading label="Loading students and sessions…" /> : (
          <div className="grid xl:grid-cols-[1fr_390px] gap-6">
            <section className="space-y-5">
              <div className="rounded-[2rem] bg-black border border-border p-1.5">
                <div className="relative aspect-video rounded-[1.6rem] overflow-hidden bg-[#0f1115] flex items-center justify-center">
                  <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                  <div className="relative z-10 w-52 h-64 max-w-[55%] border-2 border-violet-500/70 rounded-3xl pointer-events-none" />
                  {!cameraOn && <div className="absolute z-20 text-center"><ScanFace size={54} className="mx-auto text-violet-500/40" /><p className="mt-4 font-bold text-zinc-300">Camera is off</p></div>}
                  {busy && <div className="absolute inset-0 z-30 bg-black/60 flex flex-col items-center justify-center gap-3"><Loader2 className="animate-spin text-violet-400" size={34} /><p className="font-bold">{mode === "enroll" ? "Capturing 3 samples…" : "Detecting and comparing face…"}</p></div>}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={cameraOn ? stopCamera : startCamera} disabled={busy} className="rounded-2xl border border-border px-5 py-3 text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                  {cameraOn ? <CameraOff size={16} /> : <Camera size={16} />}{cameraOn ? "Stop Camera" : "Start Camera"}
                </button>
                <button onClick={mode === "recognize" ? recognize : enroll} disabled={!cameraOn || busy || (mode === "recognize" ? !sessionId : !studentId)} className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-bold text-white flex items-center gap-2 hover:bg-violet-600 disabled:opacity-50">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : mode === "recognize" ? <ScanFace size={16} /> : <UserPlus size={16} />}
                  {mode === "recognize" ? "Scan & Mark Present" : "Capture 3 Samples & Enroll"}
                </button>
              </div>
              {result?.matched && (
                <div className={`glass-card rounded-3xl p-6 flex items-start gap-4 ${result.needs_confirmation ? "border border-amber-500/40" : ""}`}>
                  {result.needs_confirmation ? <HelpCircle className="text-amber-500 shrink-0" size={26} /> : <CheckCircle2 className="text-emerald-500 shrink-0" size={26} />}
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-xl">{result.name}</h3>
                    {result.needs_confirmation ? (
                      <>
                        <p className="text-sm text-amber-500 mt-1 font-semibold">Low-confidence match. Not marked yet.</p>
                        <p className="text-amber-500 font-bold mt-2">{(result.confidence * 100).toFixed(1)}% face similarity</p>
                        <div className="flex gap-3 mt-4">
                          <button onClick={confirmMatch} disabled={confirming} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50 flex items-center gap-2">{confirming ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Yes, mark present</button>
                          <button onClick={() => { setResult(null); setNotice(""); }} disabled={confirming} className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold">Not them</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-zinc-400 mt-1">Student #{result.student_id} · Session #{result.session_id} · {result.status} by {result.method}</p>
                        <p className="text-emerald-500 font-bold mt-2">{(result.confidence * 100).toFixed(1)}% face similarity</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-5">
              {mode === "recognize" ? (
                <section className="glass-card rounded-3xl p-6 space-y-4">
                  <h3 className="font-display font-bold">Attendance session</h3>
                  {sessions.filter((item) => item.status === "open").length === 0 ? <Empty label="No open session. Start one from Live Attendance." /> : (
                    <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="w-full rounded-xl bg-background border border-border px-3 py-3 text-sm font-semibold">
                      {sessions.filter((item) => item.status === "open").map((session) => <option key={session.id} value={session.id}>{sessionLabel(session)}</option>)}
                    </select>
                  )}
                  <p className="text-xs text-zinc-500 leading-relaxed">Clear matches mark the student <strong>present</strong> (method <strong>face</strong>) automatically. Weaker matches ask you to confirm first. For hands-free scanning use <strong>Live Attendance</strong>, which has an Automatic Scanning mode.</p>
                </section>
              ) : (
                <section className="glass-card rounded-3xl p-6 space-y-4">
                  <h3 className="font-display font-bold">Student enrollment</h3>
                  <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full rounded-xl bg-background border border-border px-3 py-3 text-sm font-semibold">
                    {students.map((student) => <option key={student.student_id} value={student.student_id}>{student.name} · {student.roll_number || student.email}</option>)}
                  </select>
                  <label className="flex items-start gap-3 rounded-2xl border border-border p-4 cursor-pointer">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="accent-violet-500 w-4 h-4 mt-1" />
                    <span className="text-xs text-zinc-400 leading-relaxed">The student consents to storing a numerical face embedding for attendance. Raw camera photos will not be stored.</span>
                  </label>
                </section>
              )}

              <section className="glass-card rounded-3xl p-6">
                <h3 className="font-display font-bold flex items-center gap-2"><Users size={18} className="text-violet-400" /> Face database</h3>
                <div className="mt-4 max-h-80 overflow-y-auto divide-y divide-border/50">
                  {students.map((student) => (
                    <div key={student.student_id} className="py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{student.name}</p><p className="text-xs text-zinc-500">{student.enrolled ? `${student.samples} samples · consent recorded` : student.pending_approval ? "Waiting for approval" : "Not enrolled"}</p></div>
                      {student.enrolled ? <ShieldCheck size={17} className="text-emerald-500" /> : <ScanFace size={17} className="text-zinc-600" />}
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        )}

        <FaceApprovalReview onChanged={load} />
      </div>
    </DashboardShell>
  );
}
