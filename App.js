// App.js — ChatMend flow skeleton (no extra libs)
// Works in your current Expo dev build. No web, no Expo Go.
// Screens: 1) DefaultPrompt 2) Home 3) Conversations 4) Thread 5) Results

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  Alert,
  StatusBar,
  Platform,
} from "react-native";

// -------------------- THEME --------------------
const C = {
  bg: "#0f1422",
  fg: "#E9ECF2",
  sub: "rgba(233,236,242,0.7)",
  card: "#151B2B",
  border: "#22304A",
  primary: "#7E6BFF", // purple
  primary2: "#00D0FF", // aqua
  danger: "#FF6B6B",
};

// Simple gradient-ish block (no libraries)
const Grad = ({ height = 180 }) => (
  <View
    style={{
      height,
      width: "100%",
      backgroundColor: C.card,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Text style={{ color: C.fg, fontSize: 28, letterSpacing: 1.2 }}>
      <Text style={{ color: C.primary2 }}>CHAT</Text>
      <Text style={{ color: C.primary }}>MEND</Text>
    </Text>
  </View>
);

// Reusable UI
const Card = ({ children, style }) => (
  <View
    style={[
      {
        backgroundColor: C.card,
        borderColor: C.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const Button = ({ title, onPress, tone = "primary", disabled = false }) => {
  const bg =
    tone === "primary"
      ? C.primary
      : tone === "ghost"
      ? "transparent"
      : tone === "danger"
      ? C.danger
      : C.card;
  const border =
    tone === "ghost" ? { borderWidth: 1, borderColor: C.border } : null;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          opacity: disabled ? 0.5 : 1,
          backgroundColor: bg,
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
          marginVertical: 6,
        },
        border,
      ]}
    >
      <Text
        style={{
          color: tone === "ghost" ? C.fg : "#0B0E16",
          fontWeight: "700",
          letterSpacing: 0.3,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const Row = ({ children, style }) => (
  <View style={[{ flexDirection: "row", alignItems: "center" }, style]}>
    {children}
  </View>
);

const Pill = ({ text }) => (
  <View
    style={{
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 999,
      backgroundColor: "#1f2742",
      borderColor: C.border,
      borderWidth: 1,
    }}
  >
    <Text style={{ color: C.sub, fontSize: 12 }}>{text}</Text>
  </View>
);

const Avatar = ({ label }) => {
  const initials = (label || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#263156",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      <Text style={{ color: C.fg, fontWeight: "700" }}>{initials}</Text>
    </View>
  );
};

// -------------------- MOCK DATA (until native SMS) --------------------
const seedThreads = [
  {
    id: "Karen Hinge",
    name: "Karen Hinge",
    count: 6,
    messages: [
      {
        id: "k1",
      time: "2025-11-09T20:05:00.000Z",
        who: "Karen Hinge",
        text: "I’m ok. It’s tough like you said. Awe thanks for the hug.",
      },
      {
        id: "m1",
      time: "2025-11-09T20:08:00.000Z",
        who: "You",
        text: "Do you want to talk or stick with text?",
      },
      {
        id: "k2",
      time: "2025-11-09T20:10:00.000Z",
        who: "Karen Hinge",
        text: "Gentleman’s preference 😊",
      },
      {
        id: "k3",
      time: "2025-11-09T20:12:00.000Z",
        who: "Karen Hinge",
        text: "Don’t take it easy on me with your questions. I’ve been waiting excitedly for them haha",
      },
      {
        id: "m2",
      time: "2025-11-09T21:05:00.000Z",
        who: "You",
        text: "Okay, I’ll call at 9.",
      },
      {
        id: "k4",
      time: "2025-11-09T21:06:00.000Z",
        who: "Karen Hinge",
        text: "Perfect. Talk soon!",
      },
    ],
  },
  {
    id: "Boston Hawkes",
    name: "Boston Hawkes",
    count: 3,
    messages: [
      {
        id: "b1",
      time: "2025-11-09T18:00:00.000Z",
        who: "You",
        text: "Gym at 5?",
      },
      { id: "b2", time: "2025-11-09T18:02:00.000Z", who: "Boston Hawkes", text: "Yep" },
      { id: "b3", time: "2025-11-09T20:00:00.000Z", who: "You", text: "Nice work." },
    ],
  },
];

// Quick “analysis” placeholder
function analyzeMessages(messages) {
  // Dumb heuristics: counts + simple sentiment dictionary
  const posWords = ["great", "perfect", "good", "love", "thanks", "excited"];
  const negWords = ["angry", "upset", "sad", "tough", "hurt"];
  let you = 0,
    them = 0,
    pos = 0,
    neg = 0,
    words = 0;

  messages.forEach((m) => {
    if ((m.text || "").trim() === "") return;
    words += m.text.split(/\s+/).length;
    if (m.who === "You") you++;
    else them++;
    const t = m.text.toLowerCase();
    posWords.forEach((w) => (t.includes(w) ? pos++ : null));
    negWords.forEach((w) => (t.includes(w) ? neg++ : null));
  });

  const balance =
    you === 0 && them === 0
      ? "No messages selected."
      : you > them
      ? "You send more messages than the other person."
      : them > you
      ? "They send more messages than you."
      : "Message counts are balanced.";

  const tone =
    pos === 0 && neg === 0
      ? "Neutral tone overall."
      : pos >= neg
      ? "Tone leans positive or supportive."
      : "Tone shows tension or difficulty.";

  const bullets = [
    `${messages.length} messages analyzed (${words} words).`,
    balance,
    `Positive cues: ${pos}, Negative cues: ${neg}. ${tone}`,
    `Consider asking open-ended questions and reflecting feelings before problem-solving.`,
  ];

  return {
    summary:
      "This is a quick heuristic analysis (no AI yet). It checks volume balance and a tiny sentiment list.",
    strengths: [
      "Responsive exchange",
      pos >= neg ? "Positive language appears" : "Moments of honesty",
    ],
    risks: [
      neg > pos ? "Potential emotional friction" : "No major risk detected",
    ],
    bullets,
  };
}

function answerFollowup(baseAnalysis, question) {
  // Dumb, local answerer to keep you moving
  const q = question.toLowerCase();
  if (q.includes("attachment"))
    return "From this tiny sample, no strong attachment pattern is detectable. You need longer spans with conflict + repair to classify.";
  if (q.includes("next step") || q.includes("what should i do"))
    return "Try a clarifying question that reflects her emotion first (e.g., 'Sounds like this is tough—do you want comfort or solutions?').";
  if (q.includes("tone"))
    return baseAnalysis.bullets.find((b) => b.includes("Positive cues")) ||
      "Tone looks neutral in this snippet.";
  return "Noted. With the simple local heuristic, deeper topics need more messages or the real AI backend.";
}

// -------------------- APP --------------------
export default function App() {
  const [route, setRoute] = useState("DefaultPrompt"); // DefaultPrompt | Home | Conversations | Thread | Results
  const [isDefaultSms, setIsDefaultSms] = useState(false);

  // data
  const [threads] = useState(seedThreads);
  const [activeThread, setActiveThread] = useState(null);
  const [pickedIds, setPickedIds] = useState(new Set()); // message ids
  const [analysis, setAnalysis] = useState(null);
  const [followup, setFollowup] = useState("");
  const [followupAnswers, setFollowupAnswers] = useState([]);

  // helpers
  const togglePick = (id) => {
    setPickedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!activeThread) return;
    setPickedIds(new Set(activeThread.messages.map((m) => m.id)));
  };
  const deselectAll = () => setPickedIds(new Set());

  // -------------------- SCREENS --------------------
  const Screen = ({ children }) => (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar
        barStyle={Platform.OS === "ios" ? "light-content" : "light-content"}
      />
      <Grad height={120} />
      <View style={{ padding: 14, flex: 1 }}>{children}</View>
    </View>
  );

  const DefaultPromptScreen = () => (
    <Screen>
      <Card>
        <Text style={{ color: C.fg, fontSize: 18, fontWeight: "700" }}>
          Make ChatMend your default SMS app?
        </Text>
        <Text style={{ color: C.sub, marginTop: 6 }}>
          In dev builds we can’t actually claim the Android SMS role, so this
          button simulates the permission to let you walk through the flow.
        </Text>
        <Button
          title="Set ChatMend as Default (Simulated)"
          onPress={() => {
            setIsDefaultSms(true);
            setRoute("Home");
          }}
        />
        <Button
          title="Continue without Default"
          tone="ghost"
          onPress={() => setRoute("Home")}
        />
      </Card>
    </Screen>
  );

  const HomeScreen = () => (
    <Screen>
      <Card>
        <Text style={{ color: C.fg, fontSize: 18, fontWeight: "700" }}>
          What do you want to do?
        </Text>
        <Row style={{ marginTop: 6, gap: 8 }}>
          <Pill text={isDefaultSms ? "Default SMS: ON" : "Default SMS: OFF"} />
          <Pill text="Prototype flow" />
        </Row>
        <View style={{ marginTop: 8 }} />
        <Button
          title="Analyze"
          onPress={() => {
            setActiveThread(null);
            setPickedIds(new Set());
            setRoute("Conversations");
          }}
        />
        <Button
          title="Backup (placeholder)"
          tone="ghost"
          onPress={() => Alert.alert("Backup", "Not implemented in prototype.")}
        />
        <Button
          title="Restore (placeholder)"
          tone="ghost"
          onPress={() =>
            Alert.alert("Restore", "Not implemented in prototype.")
          }
        />
      </Card>
    </Screen>
  );

  const ConversationsScreen = () => (
    <Screen>
      <Card>
        <Text style={{ color: C.fg, fontWeight: "700", marginBottom: 8 }}>
          Conversations
        </Text>
        <FlatList
          data={threads}
          keyExtractor={(t) => t.id}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: C.border,
                marginVertical: 6,
              }}
            />
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setActiveThread(item);
                setPickedIds(new Set());
                setRoute("Thread");
              }}
              style={{ paddingVertical: 8, flexDirection: "row", alignItems: "center" }}
            >
              <Avatar label={item.name} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.fg, fontSize: 16 }}>{item.name}</Text>
                <Text style={{ color: C.sub, fontSize: 12 }}>
                  {item.count} messages
                </Text>
              </View>
              <Pill text="Open" />
            </Pressable>
          )}
          style={{ maxHeight: 380 }}
        />
      </Card>
    </Screen>
  );

  const ThreadScreen = () => {
    if (!activeThread) return null;
    return (
      <Screen>
        <Card>
          <Row style={{ justifyContent: "space-between" }}>
            <Text style={{ color: C.fg, fontWeight: "700" }}>
              {activeThread.name}
            </Text>
            <Row style={{ gap: 8 }}>
              <Pressable onPress={selectAll}>
                <Pill text="Select All" />
              </Pressable>
              <Pressable onPress={deselectAll}>
                <Pill text="Deselect All" />
              </Pressable>
            </Row>
          </Row>

          <FlatList
            data={activeThread.messages}
            keyExtractor={(m) => m.id}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: C.border,
                  marginVertical: 6,
                }}
              />
            )}
            renderItem={({ item }) => {
              const picked = pickedIds.has(item.id);
              return (
                <Pressable
                  onPress={() => togglePick(item.id)}
                  style={{
                    paddingVertical: 8,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: picked ? C.primary2 : C.border,
                      backgroundColor: picked ? C.primary2 : "transparent",
                      marginRight: 10,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.sub, fontSize: 12 }}>
                      {new Date(item.time).toLocaleString()} — {item.who}
                    </Text>
                    <Text style={{ color: C.fg }}>{item.text}</Text>
                  </View>
                </Pressable>
              );
            }}
            style={{ maxHeight: 420, marginTop: 8 }}
          />

          <Button
            title="Analyze"
            onPress={() => {
              const pick =
                pickedIds.size === 0
                  ? activeThread.messages
                  : activeThread.messages.filter((m) => pickedIds.has(m.id));
              const result = analyzeMessages(pick);
              setAnalysis({ thread: activeThread.name, result, pickedCount: pick.length });
              setFollowup("");
              setFollowupAnswers([]);
              setRoute("Results");
            }}
          />
          <Button title="Back" tone="ghost" onPress={() => setRoute("Conversations")} />
        </Card>
      </Screen>
    );
  };

  const ResultsScreen = () => {
    if (!analysis) return null;
    const { thread, result, pickedCount } = analysis;
    return (
      <Screen>
        <Card>
          <Text style={{ color: C.fg, fontWeight: "700", fontSize: 18 }}>
            Analysis Results
          </Text>
          <Text style={{ color: C.sub, marginTop: 4 }}>
            Thread: {thread} • Messages analyzed: {pickedCount}
          </Text>

          <View style={{ height: 10 }} />

          {result.bullets.map((b, i) => (
            <Row key={i} style={{ marginBottom: 6 }}>
              <Text style={{ color: C.primary2, marginRight: 6 }}>•</Text>
              <Text style={{ color: C.fg, flex: 1 }}>{b}</Text>
            </Row>
          ))}

          <View style={{ height: 10 }} />
          <Text style={{ color: C.sub }}>{result.summary}</Text>

          <View style={{ height: 12 }} />
          <Text style={{ color: C.sub, fontWeight: "700" }}>Strengths</Text>
          {result.strengths.map((s, i) => (
            <Text key={i} style={{ color: C.fg }}>
              • {s}
            </Text>
          ))}

          <View style={{ height: 8 }} />
          <Text style={{ color: C.sub, fontWeight: "700" }}>Risks</Text>
          {result.risks.map((r, i) => (
            <Text key={i} style={{ color: C.fg }}>
              • {r}
            </Text>
          ))}

          <View style={{ height: 16 }} />
          <Text style={{ color: C.fg, fontWeight: "700", marginBottom: 6 }}>
            Ask a follow-up
          </Text>
          <TextInput
            placeholder="Type a question about this analysis…"
            placeholderTextColor="#9AA4B5"
            value={followup}
            onChangeText={setFollowup}
            style={{
              borderWidth: 1,
              borderColor: C.border,
              backgroundColor: "#0f1527",
              color: C.fg,
              padding: 10,
              borderRadius: 10,
            }}
          />
          <Button
            title="Ask"
            onPress={() => {
              const reply = answerFollowup(result, followup.trim());
              if (!followup.trim()) return;
              setFollowupAnswers((prev) => [
                ...prev,
                { q: followup.trim(), a: reply },
              ]);
              setFollowup("");
            }}
          />

          {followupAnswers.length > 0 && (
            <View style={{ marginTop: 10 }}>
              {followupAnswers.map((qa, i) => (
                <View key={i} style={{ marginBottom: 10 }}>
                  <Text style={{ color: C.sub }}>You:</Text>
                  <Text style={{ color: C.fg }}>{qa.q}</Text>
                  <Text style={{ color: C.sub, marginTop: 4 }}>AI:</Text>
                  <Text style={{ color: C.fg }}>{qa.a}</Text>
                </View>
              ))}
            </View>
          )}

          <Button title="Back to Threads" tone="ghost" onPress={() => setRoute("Conversations")} />
          <Button title="Home" tone="ghost" onPress={() => setRoute("Home")} />
        </Card>
      </Screen>
    );
  };

  // -------------------- ROUTER --------------------
  let content = null;
  if (route === "DefaultPrompt") content = <DefaultPromptScreen />;
  else if (route === "Home") content = <HomeScreen />;
  else if (route === "Conversations") content = <ConversationsScreen />;
  else if (route === "Thread") content = <ThreadScreen />;
  else if (route === "Results") content = <ResultsScreen />;

  return <View style={{ flex: 1, backgroundColor: C.bg }}>{content}</View>;
}
