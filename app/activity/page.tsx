"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { activity } from "@/data/activity";

type Msg = {
	role: "user" | "assistant" | "system";
	content: string;
	image?: string;
	citations?: { id: string; text: string }[];
	flagged?: { misconception_label: string | null } | null;
};

const STUDENT_ID = "stu_demo_01";
const PERSIST_KEY = "curico.activity.state.v1";

type PersistShape = {
	stepIdx: number;
	maxReached: number;
	answers: Record<string, string>;
	msgs: Record<string, Msg[]>;
	unlockAll: boolean;
	submitted: boolean;
};

export default function StudentPage() {
	const [stepIdx, setStepIdx] = useState(0);
	const [maxReached, setMaxReached] = useState(0);
	const step = activity.steps[stepIdx];
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [msgs, setMsgs] = useState<Record<string, Msg[]>>({});

	function gotoStep(i: number) {
		if (i < 0 || i >= activity.steps.length) return;
		if (!unlockAll && i > maxReached) return; // locked
		if (i > maxReached) setMaxReached(i);
		setStepIdx(i);
	}

	function resetCurrentStep() {
		const id = step.id;
		setAnswers((a) => {
			const { [id]: _, ...rest } = a;
			return rest;
		});
		setMsgs((m) => {
			const { [id]: _, ...rest } = m;
			return rest;
		});
		setAttachedImage(null);
		setSubmitted(false);
	}

	function resetActivity() {
		setAnswers({});
		setMsgs({});
		setStepIdx(0);
		setMaxReached(0);
		setAttachedImage(null);
		setSubmitted(false);
		setUnlockAll(false);
		try { localStorage.removeItem(PERSIST_KEY); } catch {}
	}

	function advance() {
		const next = Math.min(activity.steps.length - 1, stepIdx + 1);
		setStepIdx(next);
		setMaxReached((m) => Math.max(m, next));
	}
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const [recording, setRecording] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [attachedImage, setAttachedImage] = useState<string | null>(null);
	const [camOpen, setCamOpen] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const [devOpen, setDevOpen] = useState(false);
	const [unlockAll, setUnlockAll] = useState(false);
	const [briefOpen, setBriefOpen] = useState(false);
	const [ttsEnabled, setTtsEnabled] = useState(false);
	const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
	const lastSpokenRef = useRef<string>("");
	const logRef = useRef<HTMLDivElement>(null);
	const recogRef = useRef<any>(null);
	const chatFileRef = useRef<HTMLInputElement>(null);
	const chatVideoRef = useRef<HTMLVideoElement>(null);
	const chatStreamRef = useRef<MediaStream | null>(null);

	const chat = msgs[step.id] || [];

	// Hydrate from localStorage on mount so navigating away and back keeps
	// answers, chat, and step progress.
	const hydrated = useRef(false);
	useEffect(() => {
		try {
			const raw = localStorage.getItem(PERSIST_KEY);
			if (raw) {
				const s = JSON.parse(raw) as Partial<PersistShape>;
				if (typeof s.stepIdx === "number") setStepIdx(s.stepIdx);
				if (typeof s.maxReached === "number") setMaxReached(s.maxReached);
				if (s.answers) setAnswers(s.answers);
				if (s.msgs) setMsgs(s.msgs);
				if (typeof s.unlockAll === "boolean") setUnlockAll(s.unlockAll);
				if (typeof s.submitted === "boolean") setSubmitted(s.submitted);
			}
		} catch {
			/* ignore */
		}
		hydrated.current = true;
	}, []);

	useEffect(() => {
		if (!hydrated.current) return;
		try {
			const s: PersistShape = {
				stepIdx,
				maxReached,
				answers,
				msgs,
				unlockAll,
				submitted,
			};
			localStorage.setItem(PERSIST_KEY, JSON.stringify(s));
		} catch {
			/* quota — ignore */
		}
	}, [stepIdx, maxReached, answers, msgs, unlockAll, submitted]);

	useEffect(() => {
		logRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
	}, [chat.length, step.id]);

	// TTS: hydrate the toggle from its own key so it survives resetActivity.
	useEffect(() => {
		try {
			const v = localStorage.getItem("curico.tts.enabled.v1");
			if (v === "1") setTtsEnabled(true);
		} catch {}
	}, []);
	useEffect(() => {
		try {
			localStorage.setItem("curico.tts.enabled.v1", ttsEnabled ? "1" : "0");
		} catch {}
	}, [ttsEnabled]);

	function ttsAvailable() {
		return typeof window !== "undefined" && "speechSynthesis" in window;
	}
	function stripForSpeech(s: string) {
		return s
			.replace(/<<META>>[\s\S]*$/m, "")
			.replace(/```[\s\S]*?```/g, "")
			.replace(/`([^`]+)`/g, "$1")
			.replace(/[*_#>]+/g, "")
			.trim();
	}
	function stopSpeaking() {
		if (!ttsAvailable()) return;
		window.speechSynthesis.cancel();
		setSpeakingIdx(null);
	}
	function speak(text: string, idx: number | null = null) {
		if (!ttsAvailable()) return;
		const clean = stripForSpeech(text);
		if (!clean) return;
		window.speechSynthesis.cancel();
		const u = new SpeechSynthesisUtterance(clean);
		u.rate = 1.0;
		u.pitch = 1.0;
		u.onend = () => setSpeakingIdx((cur) => (cur === idx ? null : cur));
		u.onerror = () => setSpeakingIdx((cur) => (cur === idx ? null : cur));
		setSpeakingIdx(idx);
		window.speechSynthesis.speak(u);
	}

	// Auto-speak the latest assistant message when TTS is on.
	useEffect(() => {
		if (!ttsEnabled || !ttsAvailable()) return;
		const last = chat[chat.length - 1];
		if (!last || last.role !== "assistant") return;
		const key = step.id + ":" + (chat.length - 1) + ":" + last.content;
		if (lastSpokenRef.current === key) return;
		lastSpokenRef.current = key;
		speak(last.content, chat.length - 1);
	}, [chat.length, ttsEnabled, step.id]);

	// Stop any speech when leaving the page / switching steps.
	useEffect(() => {
		return () => {
			if (ttsAvailable()) window.speechSynthesis.cancel();
		};
	}, []);
	useEffect(() => {
		stopSpeaking();
	}, [step.id]);

	const doneSteps = useMemo(() => {
		const s = new Set<string>();
		for (const [k, v] of Object.entries(answers))
			if (v && v.length) s.add(k);
		return s;
	}, [answers]);

	async function saveAnswer(v: string) {
		setAnswers((a) => ({ ...a, [step.id]: v }));
		await fetch("/api/misconceptions", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				studentId: STUDENT_ID,
				stepId: step.id,
				kind: step.inputKind,
				value: v,
			}),
		});
	}

	async function send(text: string, imageOverride?: string | null) {
		const img = imageOverride === undefined ? attachedImage : imageOverride;
		if ((!text.trim() && !img) || sending) return;
		setSending(true);
		const displayText =
			text.trim() || (img ? "Here's a photo — how does it look?" : "");
		const nextChat: Msg[] = [
			...chat,
			{ role: "user", content: displayText, image: img || undefined },
		];
		setMsgs((m) => ({ ...m, [step.id]: nextChat }));
		setInput("");
		setAttachedImage(null);
		try {
			const r = await fetch("/api/chat", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					studentId: STUDENT_ID,
					stepId: step.id,
					currentAnswer: answers[step.id] || "",
					image: img || undefined,
					messages: nextChat
						.filter((m) => m.role !== "system")
						.map((m) => ({ role: m.role, content: m.content })),
				}),
			});
			const data = await r.json();
			if (!r.ok) {
				setMsgs((m) => ({
					...m,
					[step.id]: [
						...nextChat,
						{
							role: "system",
							content: data.error || `HTTP ${r.status}`,
						},
					],
				}));
				return;
			}
			setMsgs((m) => ({
				...m,
				[step.id]: [
					...nextChat,
					{
						role: "assistant",
						content: data.reply,
						citations: data.citations,
						flagged: data.flagged,
					},
				],
			}));
		} catch (e: any) {
			setMsgs((m) => ({
				...m,
				[step.id]: [
					...nextChat,
					{ role: "system", content: `Network error: ${e.message}` },
				],
			}));
		} finally {
			setSending(false);
		}
	}

	function fileToDataUrl(f: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const r = new FileReader();
			r.onload = () => resolve(r.result as string);
			r.onerror = () => reject(r.error);
			r.readAsDataURL(f);
		});
	}

	async function attachFromFile(f: File) {
		if (!f.type.startsWith("image/")) return;
		setAttachedImage(await fileToDataUrl(f));
	}

	async function openChatCamera() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: { ideal: "environment" } },
				audio: false,
			});
			chatStreamRef.current = stream;
			setCamOpen(true);
			// wait for the <video> to mount, then attach
			setTimeout(async () => {
				if (chatVideoRef.current) {
					chatVideoRef.current.srcObject = stream;
					await chatVideoRef.current.play();
				}
			}, 50);
		} catch (e: any) {
			alert("Camera unavailable: " + (e.message || e));
		}
	}

	function stopChatCamera() {
		chatStreamRef.current?.getTracks().forEach((t) => t.stop());
		chatStreamRef.current = null;
		setCamOpen(false);
	}

	function captureFromChatCamera() {
		const v = chatVideoRef.current;
		if (!v) return;
		const w = v.videoWidth,
			h = v.videoHeight;
		if (!w || !h) return;
		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
		canvas.getContext("2d")!.drawImage(v, 0, 0, w, h);
		setAttachedImage(canvas.toDataURL("image/jpeg", 0.85));
		stopChatCamera();
	}

	function toggleMic() {
		const SR =
			(window as any).SpeechRecognition ||
			(window as any).webkitSpeechRecognition;
		if (!SR) {
			alert("Voice input not supported in this browser. Try Chrome.");
			return;
		}
		if (recording) {
			recogRef.current?.stop();
			return;
		}
		const r = new SR();
		r.lang = "en-US";
		r.interimResults = false;
		r.onresult = (e: any) => {
			const t = e.results[0][0].transcript;
			setInput((cur) => (cur ? cur + " " : "") + t);
		};
		r.onend = () => setRecording(false);
		r.start();
		recogRef.current = r;
		setRecording(true);
	}

	return (
		<div className="shell full">
			<div className="top">
				<div>
					<h1>{activity.title}</h1>
					<div className="meta">
						{activity.subject} · Goal: {activity.learningGoal}
					</div>
				</div>
				<div className="row" style={{ gap: 8 }}>
					<button
						className="btn ghost"
						onClick={() => setBriefOpen(true)}
						style={{ padding: "6px 12px", fontSize: 13 }}
					>
						📋 Lab brief
					</button>
					<Link href="/teacher">Teacher view →</Link>
				</div>
			</div>

			<div className="layout">
				<aside className="timeline" aria-label="Activity steps">
					{activity.steps.map((s, i) => {
						const locked = !unlockAll && i > maxReached;
						const done = doneSteps.has(s.id) && i !== stepIdx;
						const active = i === stepIdx;
						const cls =
							"tl-item" +
							(active ? " active" : "") +
							(done ? " done" : "") +
							(locked ? " locked" : "");
						return (
							<div
								key={s.id}
								className={cls}
								onClick={() => gotoStep(i)}
								title={
									locked ? "Reach this step first" : s.title
								}
							>
								<div className="num">Step {i + 1}</div>
								<div className="lbl">{s.title}</div>
							</div>
						);
					})}
				</aside>

				<div className="main">
					<div className="card">
						<div className="step-header">
							<div className="badge">
								Step {stepIdx + 1} of {activity.steps.length}
							</div>
							<h2>{step.title}</h2>
						</div>
						{step.concept && (
							<div className="step-block concept">
								<div className="block-label">📖 Learn</div>
								<div className="block-body concept-body">
									<ConceptText text={step.concept} />
								</div>
							</div>
						)}
						<div className="step-block">
							<div className="block-label">🎯 Goal</div>
							<p className="block-body">{stepGoal(step)}</p>
						</div>
						<div className="step-block">
							<div className="block-label">📋 What to do</div>
							<p className="block-body">{step.instructions}</p>
						</div>
						<div className="step-block">
							<div className="block-label">✏️ Your response</div>
							<StepInput
								step={step}
								value={answers[step.id] || ""}
								onSave={saveAnswer}
							/>
						</div>
						<div
							className="row"
							style={{
								marginTop: 18,
								justifyContent: "space-between",
							}}
						>
							<button
								className="btn secondary"
								disabled={stepIdx === 0}
								onClick={() => setStepIdx(stepIdx - 1)}
							>
								← Previous
							</button>
							{stepIdx < activity.steps.length - 1 ? (
								<button className="btn" onClick={advance}>
									Next →
								</button>
							) : (
								<button
									className="btn"
									disabled={!answers[step.id] || submitted}
									onClick={() => setSubmitted(true)}
								>
									{submitted
										? "✓ Submitted"
										: "Submit activity"}
								</button>
							)}
						</div>
					</div>

					<div
						className={"card chat" + (dragOver ? " drag" : "")}
						onDragOver={(e) => {
							e.preventDefault();
							setDragOver(true);
						}}
						onDragLeave={() => setDragOver(false)}
						onDrop={async (e) => {
							e.preventDefault();
							setDragOver(false);
							const f = e.dataTransfer.files?.[0];
							if (f) await attachFromFile(f);
						}}
						onPaste={async (e) => {
							const item = Array.from(e.clipboardData.items).find(
								(i) => i.type.startsWith("image/"),
							);
							const f = item?.getAsFile();
							if (f) await attachFromFile(f);
						}}
					>
						<div
							className="row"
							style={{
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<h2 style={{ margin: 0 }}>Ask the AI helper</h2>
							<button
								className="btn ghost"
								title={
									ttsEnabled
										? "Turn off text-to-speech"
										: "Turn on text-to-speech"
								}
								onClick={() => {
									if (ttsEnabled) stopSpeaking();
									setTtsEnabled((v) => !v);
								}}
								style={{ padding: "2px 8px" }}
							>
								{ttsEnabled ? "🔊 On" : "🔇 Off"}
							</button>
						</div>
						<div className="muted" style={{ marginBottom: 6 }}>
							Grounded in this activity sheet only. Hints, not
							answers. Drop or paste an image, use 📷, or the 🎤.
						</div>
						<div className="chat-log" ref={logRef}>
							{chat.length === 0 && (
								<div className="msg assistant">
									Hi! I'm here for step {stepIdx + 1}:{" "}
									<b>{step.title}</b>. Ask a question, or show
									me a photo of what you're working on.
								</div>
							)}
							{chat.map((m, i) => (
								<div key={i}>
									<div className={"msg " + m.role}>
										{m.image && (
											<img
												src={m.image}
												alt="attached"
												style={{
													maxWidth: "100%",
													maxHeight: 220,
													borderRadius: 8,
													marginBottom: m.content
														? 6
														: 0,
													display: "block",
												}}
											/>
										)}
										{m.content}
										{m.role === "assistant" &&
											m.content &&
											ttsAvailable() && (
												<button
													className="btn ghost"
													title={
														speakingIdx === i
															? "Stop"
															: "Read aloud"
													}
													onClick={() =>
														speakingIdx === i
															? stopSpeaking()
															: speak(
																	m.content,
																	i,
																)
													}
													style={{
														marginLeft: 6,
														padding: "0 6px",
														fontSize: 12,
														verticalAlign: "middle",
													}}
												>
													{speakingIdx === i
														? "⏹"
														: "🔊"}
												</button>
											)}
									</div>
									{m.citations && m.citations.length > 0 && (
										<div className="citations">
											grounded in:{" "}
											{m.citations
												.map((c) => (
													<code
														key={c.id}
														title={c.text}
													>
														{c.id}
													</code>
												))
												.reduce<React.ReactNode[]>(
													(a, e, i) =>
														a.concat(
															i ? [" ", e] : [e],
														),
													[],
												)}
										</div>
									)}
									{m.flagged &&
										m.flagged.misconception_label && (
											<div className="citations">
												<span className="pill warn">
													flagged:{" "}
													{
														m.flagged
															.misconception_label
													}{" "}
													(sent to teacher)
												</span>
											</div>
										)}
								</div>
							))}
						</div>

						{camOpen && (
							<div className="cam-modal">
								<video
									ref={chatVideoRef}
									playsInline
									muted
									style={{
										width: "100%",
										borderRadius: 8,
										background: "#000",
									}}
								/>
								<div
									className="row"
									style={{ gap: 8, marginTop: 6 }}
								>
									<button
										className="btn"
										onClick={captureFromChatCamera}
									>
										📸 Capture
									</button>
									<button
										className="btn ghost"
										onClick={stopChatCamera}
									>
										Cancel
									</button>
								</div>
							</div>
						)}

						{attachedImage && (
							<div className="attach-preview">
								<img src={attachedImage} alt="pending" />
								<button
									className="btn ghost"
									onClick={() => setAttachedImage(null)}
								>
									Remove
								</button>
							</div>
						)}

						<input
							ref={chatFileRef}
							type="file"
							accept="image/*"
							style={{ display: "none" }}
							onChange={async (e) => {
								const f = e.target.files?.[0];
								if (f) await attachFromFile(f);
								if (chatFileRef.current)
									chatFileRef.current.value = "";
							}}
						/>

						<div className="chat-input">
							<button
								className={"mic " + (recording ? "rec" : "")}
								onClick={toggleMic}
								title="Voice input"
							>
								{recording ? "● Rec" : "🎤"}
							</button>
							<button
								className="mic"
								onClick={openChatCamera}
								title="Camera"
							>
								📷
							</button>
							<button
								className="mic"
								onClick={() => chatFileRef.current?.click()}
								title="Attach image"
							>
								📎
							</button>
							<input
								className="input"
								placeholder={
									attachedImage
										? "Optional caption — Enter to send"
										: "Ask a question about this step…"
								}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") send(input);
								}}
							/>
							<button
								className="btn"
								disabled={
									sending || (!input.trim() && !attachedImage)
								}
								onClick={() => send(input)}
							>
								{sending ? "…" : "Send"}
							</button>
						</div>
					</div>
				</div>
			</div>

			{briefOpen && (
				<div className="modal-scrim" onClick={() => setBriefOpen(false)}>
					<div className="modal" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<div>
								<div className="meta" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 }}>
									Lab brief
								</div>
								<h2 style={{ margin: "4px 0 0" }}>{activity.title}</h2>
								<div className="meta" style={{ fontSize: 13 }}>
									{activity.subject} · {activity.gradeBand}
								</div>
							</div>
							<button className="btn ghost" onClick={() => setBriefOpen(false)}>
								Close ✕
							</button>
						</div>
						<div className="modal-body">
							<div className="step-block">
								<div className="block-label">🎯 Learning goal</div>
								<p className="block-body">{activity.learningGoal}</p>
							</div>
							<div className="step-block">
								<div className="block-label">📋 Materials</div>
								<ul style={{ paddingLeft: 20, margin: 0 }}>
									{activity.materials.map((m, i) => <li key={i}>{m}</li>)}
								</ul>
							</div>
							<div className="step-block" style={{ borderLeft: "3px solid #f2994a", paddingLeft: 12 }}>
								<div className="block-label">⚠️ Safety</div>
								<ul style={{ paddingLeft: 20, margin: 0 }}>
									{activity.safety.map((s, i) => <li key={i}>{s}</li>)}
								</ul>
							</div>
							<div className="step-block">
								<div className="block-label">🧭 Step list ({activity.steps.length} steps)</div>
								<ol style={{ paddingLeft: 20, margin: 0 }}>
									{activity.steps.map((s, i) => (
										<li
											key={s.id}
											style={{
												cursor: (unlockAll || i <= maxReached) ? "pointer" : "default",
												color: i === stepIdx ? "#4a5cff" : (i > maxReached && !unlockAll ? "#a0a6b8" : "#3a4256"),
												fontWeight: i === stepIdx ? 600 : 400,
												padding: "2px 0",
											}}
											onClick={() => {
												if (unlockAll || i <= maxReached) {
													gotoStep(i);
													setBriefOpen(false);
												}
											}}
										>
											{s.title}
										</li>
									))}
								</ol>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Floating dev panel — for demoing, not shipped to students */}
			<button
				className="dev-fab"
				onClick={() => setDevOpen((x) => !x)}
				title="Dev tools"
			>
				{devOpen ? "×" : "⚙"}
			</button>
			{devOpen && (
				<div className="dev-panel" role="dialog">
					<div className="dev-panel-title">Dev tools</div>
					<div className="dev-row">
						<label>
							<input
								type="checkbox"
								checked={unlockAll}
								onChange={(e) => setUnlockAll(e.target.checked)}
							/>{" "}
							Unlock all steps
						</label>
					</div>
					<div className="dev-row">
						<label>Jump to step:</label>
						<select
							value={stepIdx}
							onChange={(e) => gotoStep(Number(e.target.value))}
						>
							{activity.steps.map((s, i) => (
								<option key={s.id} value={i}>
									{i + 1}. {s.title}
								</option>
							))}
						</select>
					</div>
					<div className="dev-row" style={{ gap: 6 }}>
						<button
							className="btn secondary"
							onClick={resetCurrentStep}
						>
							Reset current step
						</button>
						<button
							className="btn ghost"
							onClick={() => {
								setMsgs((m) => ({ ...m, [step.id]: [] }));
								setAttachedImage(null);
							}}
						>
							Clear chat only
						</button>
					</div>
					<div className="dev-row">
						<button
							className="btn"
							style={{ background: "#a83030" }}
							onClick={() => {
								if (
									confirm(
										"Reset the whole activity? This clears answers, chat, and progress.",
									)
								) {
									resetActivity();
								}
							}}
						>
							Reset activity
						</button>
					</div>
					{step.expected && (
						<div className="dev-expected">
							<div className="block-label" style={{ color: "#1a7f3a" }}>
								✅ Instructor-only expected answer
							</div>
							<div className="dev-expected-body">{step.expected}</div>
						</div>
					)}
					<div className="dev-misconceptions">
						<div className="block-label">🎭 Induce a misconception</div>
						<div className="dev-mc-hint">
							Sends a canned student message. Should trigger a Socratic hint and flag it on /teacher.
						</div>
						{activity.commonMisconceptions.map((m) => (
							<button
								key={m.id}
								className="dev-mc-btn"
								onClick={() => {
									void send(DEMO_PROMPTS[m.id] || m.description);
									setDevOpen(false);
								}}
								title={m.description}
							>
								{m.label}
							</button>
						))}
					</div>
					<div className="dev-hint">
						Progress: step {stepIdx + 1} of {activity.steps.length}{" "}
						· maxReached {maxReached + 1} ·{" "}
						{Object.keys(answers).length} answers ·{" "}
						{Object.values(msgs).reduce(
							(n, ms) => n + ms.length,
							0,
						)}{" "}
						chat msgs
					</div>
				</div>
			)}
		</div>
	);
}

// Very small markdown-lite renderer for concept blocks. Supports paragraphs
// (blank-line separated), **bold**, _italic_, and indented code blocks
// (four-space or tab prefix, contiguous lines).
function ConceptText({ text }: { text: string }) {
	const blocks: React.ReactNode[] = [];
	const paras = text.split(/\n\s*\n/);
	paras.forEach((raw, i) => {
		// indented code block?
		const lines = raw.split("\n");
		const codeLines = lines.filter((l) => /^(?:\t| {4})/.test(l));
		if (codeLines.length && codeLines.length === lines.length) {
			blocks.push(
				<pre key={i} className="concept-code">
					{codeLines.map((l) => l.replace(/^(?:\t| {4})/, "")).join("\n")}
				</pre>,
			);
			return;
		}
		// list items?
		if (lines.every((l) => /^\s*-\s+/.test(l))) {
			blocks.push(
				<ul key={i}>
					{lines.map((l, j) => (
						<li key={j}>{inline(l.replace(/^\s*-\s+/, ""))}</li>
					))}
				</ul>,
			);
			return;
		}
		blocks.push(<p key={i}>{inline(raw)}</p>);
	});
	return <>{blocks}</>;

	function inline(s: string): React.ReactNode {
		const parts: React.ReactNode[] = [];
		let rest = s;
		let key = 0;
		const re = /(\*\*[^*]+\*\*|_[^_]+_)/;
		while (rest.length) {
			const m = rest.match(re);
			if (!m) {
				parts.push(rest);
				break;
			}
			const idx = m.index || 0;
			if (idx > 0) parts.push(rest.slice(0, idx));
			const tok = m[0];
			if (tok.startsWith("**")) parts.push(<b key={key++}>{tok.slice(2, -2)}</b>);
			else parts.push(<i key={key++}>{tok.slice(1, -1)}</i>);
			rest = rest.slice(idx + tok.length);
		}
		return <>{parts}</>;
	}
}

// Canned first-person student prompts used by the dev panel to trigger
// each known misconception on demand. Keyed by misconception id from
// data/activity.ts. If missing, the description is sent instead.
const DEMO_PROMPTS: Record<string, string> = {
	m_endpoint_dark:
		"I titrated until it was clearly pink and stayed that way — that means I hit the endpoint, right?",
	m_rinse_water:
		"I already rinsed the burette with DI water three times, so I'm good to fill it with NaOH.",
	m_no_swirl:
		"I don't really swirl the flask — I just let the drops fall in and watch for the colour to change.",
	m_pipette_blow:
		"I blew the last drop out of the volumetric pipette so I know I got all 5.00 mL out.",
	m_M_vs_percent:
		"My molarity of acetic acid is 0.83 M, so the vinegar is 0.83 % acetic acid, right?",
	m_stoich:
		"It's an acid–base reaction so the ratio is 1:2 — I should multiply moles of NaOH by 2 to get moles of acetic acid.",
	m_air_bubble:
		"There's a small air bubble in the burette tip but it's tiny, so I'll just ignore it and start titrating.",
	m_reading_top:
		"I read the burette at the top of the meniscus — the flat line where the liquid meets the air.",
	m_parallax:
		"I read the burette while standing up looking down at it, that should be fine.",
	m_indicator_dose:
		"I added like 10 drops of phenolphthalein so the colour change is really obvious.",
	m_average_all:
		"I averaged all three trials — even the one that was clearly dark pink — since more data is better.",
	m_total_volume:
		"For the molarity I divided my moles of acetic acid by 25 mL because that's the total volume in the flask.",
};

// Short one-liner describing why this step exists. Uses per-step overrides
// where the step's title is too terse to stand alone as a goal.
function stepGoal(s: (typeof activity.steps)[number]): string {
	const overrides: Record<string, string> = {
		s01: "Confirm you've read the safety notes and get a one-sentence explanation of any rule you're unsure about, before you touch glassware.",
		s02: "Put the purpose of today's titration in your own words so we can check your mental model before you start measuring.",
		s03: "Choose the correct burette-rinsing procedure — the wrong choice biases every trial systematically.",
		s04: "Fill the burette and photograph the initial meniscus at eye level; get feedback on your reading technique before recording numbers.",
		s05: "Record the initial burette reading to the precision a Class-A burette allows (two decimals).",
		s06: "Prepare the analyte in the Erlenmeyer and confirm the pre-titration colour is what phenolphthalein should show in an acid.",
		s07: "Describe the technique you used for Trial 1 — swirling, rate, when you slowed down — so bad habits get caught before they cost you all three trials.",
		s08: "Photograph the endpoint against a white background so the faint pink can actually be judged.",
		s09: "Record the final burette reading for Trial 1 to 0.01 mL.",
		s10: "Repeat the titration; the delivered volume for Trial 2 should agree with Trial 1 within ~0.2 mL if your technique is consistent.",
		s11: "One more trial — three trials let you drop an outlier with justification.",
		s12: "Pick the two trials whose endpoints looked palest — the lab's convention for dropping the trial most likely to have overshot equivalence.",
		s13: "Compute the mean volume of NaOH used, from the two trials you kept.",
		s14: "Convert the average volume into moles of NaOH using the standardized concentration (M × V in L).",
		s15: "Use the balanced neutralization equation and its 1:1 mole ratio to state the moles of acetic acid in your 5.00 mL sample.",
		s16: "Compute the molarity of acetic acid in the original vinegar (not the diluted flask) — this is where students often divide by the wrong volume.",
		s17: "Combine mass of acetic acid with mass of vinegar to report % w/w — the number a consumer sees on the bottle.",
		s18: "Reflect on which measurement dominates your error, backed by a specific number.",
	};
	return overrides[s.id] || s.title;
}

function StepInput({
	step,
	value,
	onSave,
}: {
	step: (typeof activity.steps)[number];
	value: string;
	onSave: (v: string) => void;
}) {
	const [local, setLocal] = useState(value);
	useEffect(() => setLocal(value), [value, step.id]);

	if (step.inputKind === "choice") {
		return (
			<div className="choices">
				{(step.choices || []).map((c) => (
					<div
						key={c}
						className={"choice " + (local === c ? "selected" : "")}
						onClick={() => {
							setLocal(c);
							onSave(c);
						}}
					>
						{c}
					</div>
				))}
			</div>
		);
	}
	if (step.inputKind === "photo") {
		return (
			<PhotoCapture value={local} setLocal={setLocal} onSave={onSave} />
		);
	}
	const isNumber = step.inputKind === "number";
	return (
		<div className="row" style={{ gap: 8 }}>
			{isNumber ? (
				<input
					className="input"
					type="number"
					step="any"
					value={local}
					onChange={(e) => {
						setLocal(e.target.value);
						onSave(e.target.value);
					}}
				/>
			) : (
				<textarea
					className="input"
					value={local}
					onChange={(e) => {
						setLocal(e.target.value);
						onSave(e.target.value);
					}}
				/>
			)}
			{step.unit && <span className="muted">{step.unit}</span>}
		</div>
	);
}

function PhotoCapture({
	value,
	setLocal,
	onSave,
}: {
	value: string;
	setLocal: (v: string) => void;
	onSave: (v: string) => void;
}) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [live, setLive] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [facing, setFacing] = useState<"environment" | "user">("environment");

	useEffect(() => {
		return () => stop();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function start(mode: "environment" | "user" = facing) {
		setError(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: { ideal: mode } },
				audio: false,
			});
			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play();
			}
			setLive(true);
			setFacing(mode);
		} catch (e: any) {
			setError(e.message || "Camera unavailable");
		}
	}

	function stop() {
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
		setLive(false);
	}

	function capture() {
		const v = videoRef.current;
		if (!v) return;
		const w = v.videoWidth;
		const h = v.videoHeight;
		if (!w || !h) return;
		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d")!;
		ctx.drawImage(v, 0, 0, w, h);
		const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
		setLocal(dataUrl);
		onSave(
			`[photo captured from camera: ${w}×${h}, ${Math.round(dataUrl.length / 1024)} KB]`,
		);
		stop();
	}

	async function flip() {
		stop();
		await start(facing === "environment" ? "user" : "environment");
	}

	return (
		<div>
			{!live && !value.startsWith("data:image") && (
				<div className="row" style={{ gap: 8 }}>
					<button className="btn" onClick={() => start()}>
						📷 Open camera
					</button>
					<label
						className="btn secondary"
						style={{ cursor: "pointer" }}
					>
						Upload file
						<input
							type="file"
							accept="image/*"
							style={{ display: "none" }}
							onChange={(e) => {
								const f = e.target.files?.[0];
								if (!f) return;
								const reader = new FileReader();
								reader.onload = () => {
									const dataUrl = reader.result as string;
									setLocal(dataUrl);
									onSave(
										`[photo uploaded: ${f.name}, ${Math.round(f.size / 1024)} KB]`,
									);
								};
								reader.readAsDataURL(f);
							}}
						/>
					</label>
				</div>
			)}
			{live && (
				<div>
					<video
						ref={videoRef}
						playsInline
						muted
						style={{
							width: "100%",
							maxWidth: 400,
							borderRadius: 8,
							background: "#000",
						}}
					/>
					<div className="row" style={{ gap: 8, marginTop: 8 }}>
						<button className="btn" onClick={capture}>
							📸 Capture
						</button>
						<button className="btn secondary" onClick={flip}>
							Flip
						</button>
						<button className="btn ghost" onClick={stop}>
							Cancel
						</button>
					</div>
				</div>
			)}
			{!live && value.startsWith("data:image") && (
				<div>
					<img
						className="thumb"
						src={value}
						alt="student photo"
						style={{ maxHeight: 200 }}
					/>
					<div className="row" style={{ gap: 8, marginTop: 8 }}>
						<button
							className="btn secondary"
							onClick={() => {
								setLocal("");
								onSave("");
								start();
							}}
						>
							Retake
						</button>
					</div>
				</div>
			)}
			{error && (
				<div
					className="muted"
					style={{ marginTop: 8, color: "#a83030" }}
				>
					Camera error: {error}
				</div>
			)}
		</div>
	);
}
