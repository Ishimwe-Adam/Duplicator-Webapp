import { useTheme } from "@/context/ThemeContext";
import { Section, StatusPill } from "@/components/dashboard/Primitives";
import {
  WORKSPACE_ANNOUNCEMENTS_KEY,
  WORKSPACE_CALENDAR_KEY,
  WORKSPACE_GALLERY_KEY,
  WORKSPACE_RECOMMENDATIONS_KEY,
  WORKSPACE_TASKS_KEY,
  useWorkspaceStoredState,
} from "@/lib/workspaceFeed";
import { CalendarDays, ClipboardList, Image, Megaphone, Sparkles } from "lucide-react";

type Role = "admin" | "staff" | "client";

type SharedTask = {
  id: number;
  title: string;
  owner: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  status: "todo" | "doing" | "done";
  createdBy: string;
};

type SharedCalendarEvent = {
  id: number;
  title: string;
  date: string;
  tone: "blue" | "green" | "amber" | "red";
  createdBy: string;
};

type SharedAnnouncement = {
  id: number;
  title: string;
  body: string;
  audience: string;
  date: string;
  createdBy: string;
};

type SharedGalleryItem = {
  id: number;
  title: string;
  project: string;
  category: string;
  client: string;
  postedBy: string;
  date: string;
  featured: boolean;
  ratings: Array<{ by: string; value: number }>;
};

type SharedRecommendationItem = {
  id: number;
  title: string;
  category: string;
  summary: string;
  priority: "High" | "Medium" | "Low";
  target: string;
  poster: string;
  createdAt: string;
  status: "new" | "reviewing" | "actioned";
  contact: string;
};

function averageRating(item: SharedGalleryItem) {
  if (item.ratings.length === 0) return 0;
  return item.ratings.reduce((sum, rating) => sum + rating.value, 0) / item.ratings.length;
}

export default function SharedWorkspaceBoard({ role }: { role: Role }) {
  const { c, isDark } = useTheme();
  const [tasks] = useWorkspaceStoredState<SharedTask[]>(WORKSPACE_TASKS_KEY, []);
  const [calendar] = useWorkspaceStoredState<SharedCalendarEvent[]>(WORKSPACE_CALENDAR_KEY, []);
  const [announcements] = useWorkspaceStoredState<SharedAnnouncement[]>(WORKSPACE_ANNOUNCEMENTS_KEY, []);
  const [gallery] = useWorkspaceStoredState<SharedGalleryItem[]>(WORKSPACE_GALLERY_KEY, []);
  const [recommendations] = useWorkspaceStoredState<SharedRecommendationItem[]>(WORKSPACE_RECOMMENDATIONS_KEY, []);

  const cards = [
    role !== "client"
      ? {
          title: "Tasks",
          icon: ClipboardList,
          accent: "#00C6FF",
          items: tasks.slice(0, 3).map((task) => ({
            primary: task.title,
            secondary: `${task.owner} · ${task.due}`,
            meta: `Posted by ${task.createdBy}`,
            tone: task.priority === "High" ? "red" : task.priority === "Medium" ? "amber" : "grey",
            pill: task.status,
          })),
        }
      : null,
    {
      title: "Calendar",
      icon: CalendarDays,
      accent: "#22C55E",
      items: calendar.slice(0, 3).map((event) => ({
        primary: event.title,
        secondary: event.date,
        meta: `Posted by ${event.createdBy}`,
        tone: event.tone,
        pill: event.tone,
      })),
    },
    {
      title: "Announcements",
      icon: Megaphone,
      accent: "#A78BFA",
      items: announcements.slice(0, 2).map((post) => ({
        primary: post.title,
        secondary: post.body,
        meta: `${post.date} · ${post.audience} · ${post.createdBy}`,
        tone: "blue",
        pill: post.audience,
      })),
    },
    {
      title: "Gallery",
      icon: Image,
      accent: "#00C6FF",
      items: gallery.slice(0, 3).map((item) => ({
        primary: item.title,
        secondary: `${item.project} · ${item.category}`,
        meta: `Posted by ${item.postedBy} · ${item.client}`,
        tone: item.featured ? "green" : "blue",
        pill: gallery.length === 0 ? "New" : `${Math.round(averageRating(item) || 0)}★`,
      })),
    },
    {
      title: "Recommendations",
      icon: Megaphone,
      accent: "#F5C518",
      items: recommendations.slice(0, 3).map((item) => ({
        primary: item.title,
        secondary: `${item.category} · ${item.target}`,
        meta: `Posted by ${item.poster} · ${item.createdAt}`,
        tone: item.priority === "High" ? "red" : item.priority === "Medium" ? "amber" : "green",
        pill: item.status,
      })),
    },
  ].filter(Boolean) as Array<{
    title: string;
    icon: typeof ClipboardList;
    accent: string;
    items: Array<{
      primary: string;
      secondary: string;
      meta: string;
      tone: "blue" | "green" | "amber" | "red" | "grey";
      pill: string;
    }>;
  }>;

  const galleryStats = {
    total: gallery.length,
    featured: gallery.filter((item) => item.featured).length,
    average: gallery.length === 0 ? 0 : Math.round((gallery.reduce((sum, item) => sum + averageRating(item), 0) / gallery.length) * 10) / 10,
  };

  return (
    <Section
      title="Workspace board"
      subtitle="Shared tasks, calendar items, announcements, and gallery posts that appear across accounts."
      noPad
    >
      <div
        style={{
          display: "grid",
          gap: 16,
          padding: 20,
          gridTemplateColumns: role === "client" ? "repeat(auto-fit, minmax(260px, 1fr))" : "repeat(auto-fit, minmax(235px, 1fr))",
        }}
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              style={{
                border: `1px solid ${isDark ? c.border : c.navBorder}`,
                borderRadius: 14,
                background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)",
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(38,69,200,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: card.accent,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <div style={{ color: c.textPrimary, fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>{card.title}</div>
                    <div style={{ color: c.textMuted, fontSize: 11, fontFamily: "'Inter', sans-serif" }}>{card.items.length} item{card.items.length === 1 ? "" : "s"}</div>
                  </div>
                </div>
                <Sparkles size={14} style={{ color: card.accent }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {card.items.length === 0 ? (
                  <div
                    style={{
                      border: `1px dashed ${isDark ? c.border : c.navBorder}`,
                      borderRadius: 12,
                      padding: 16,
                      color: c.textMuted,
                      fontSize: 12,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Nothing posted yet.
                  </div>
                ) : (
                  card.items.map((item, index) => (
                    <div
                      key={`${card.title}-${index}`}
                      style={{
                        border: `1px solid ${isDark ? c.border : c.borderHover}`,
                        borderRadius: 12,
                        padding: 12,
                        background: isDark ? "rgba(4,9,26,0.35)" : "rgba(248,252,255,0.9)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: c.textPrimary, fontSize: 13, fontWeight: 500, lineHeight: 1.35 }}>{item.primary}</div>
                          <div style={{ color: c.textSecondary, fontSize: 11.5, marginTop: 3, lineHeight: 1.4 }}>{item.secondary}</div>
                          <div style={{ color: c.textFaint, fontSize: 10.5, marginTop: 6 }}>{item.meta}</div>
                        </div>
                        <StatusPill tone={item.tone}>{item.pill}</StatusPill>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "0 20px 20px" }}>
        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: role === "client" ? "repeat(3, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
          }}
        >
          <div style={{ border: `1px solid ${isDark ? c.border : c.navBorder}`, borderRadius: 14, padding: 14, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)" }}>
            <div style={{ color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Gallery posts</div>
            <div style={{ marginTop: 6, color: c.textPrimary, fontSize: 20, fontWeight: 600 }}>{galleryStats.total}</div>
          </div>
          <div style={{ border: `1px solid ${isDark ? c.border : c.navBorder}`, borderRadius: 14, padding: 14, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)" }}>
            <div style={{ color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Featured</div>
            <div style={{ marginTop: 6, color: c.textPrimary, fontSize: 20, fontWeight: 600 }}>{galleryStats.featured}</div>
          </div>
          <div style={{ border: `1px solid ${isDark ? c.border : c.navBorder}`, borderRadius: 14, padding: 14, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)" }}>
            <div style={{ color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Average rating</div>
            <div style={{ marginTop: 6, color: c.textPrimary, fontSize: 20, fontWeight: 600 }}>{galleryStats.average ? `${galleryStats.average} / 5` : "New"}</div>
          </div>
          {role !== "client" && (
            <div style={{ border: `1px solid ${isDark ? c.border : c.navBorder}`, borderRadius: 14, padding: 14, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)" }}>
              <div style={{ color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Ready for review</div>
              <div style={{ marginTop: 6, color: c.textPrimary, fontSize: 20, fontWeight: 600 }}>{gallery.filter((item) => !item.featured).length}</div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
