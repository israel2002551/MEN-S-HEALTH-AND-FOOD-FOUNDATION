(function () {
  const DB_KEY = "mhff_database_v1";
  const SESSION_KEY = "mhff_session_v1";
  const config = window.MHFF_SUPABASE_CONFIG || {};
  const hasSupabase = Boolean(config.url && config.anonKey && window.supabase);
  const client = hasSupabase ? window.supabase.createClient(config.url, config.anonKey) : null;

  const seed = {
    users: [
      { id: "admin-1", role: "admin", name: "Site Administrator", email: "admin@mhff.org", password: "admin123", phone: "+2347044250591", skill: "Administration", createdAt: "2026-07-23" },
      { id: "vol-1", role: "volunteer", name: "Demo Volunteer", email: "volunteer@mhff.org", password: "volunteer123", phone: "+2347000000000", skill: "Community worker", createdAt: "2026-07-23" }
    ],
    activities: [
      { id: "act-1", title: "Men's Preventive Health Screening Camp", category: "Health Screening", date: "2026-07-20", location: "Ovia, Edo State", image: "assets/images/health-screening.png", summary: "Free blood pressure checks, glucose screening, and health education for adult men and families.", body: "Volunteers supported a community screening exercise focused on early detection, health literacy, and practical referral guidance." },
      { id: "act-2", title: "Emergency Food Assistance Outreach", category: "Food Drive", date: "2026-07-14", location: "Benin City, Edo State", image: "assets/images/food-distribution.png", summary: "Food packs were distributed to vulnerable households with nutrition education support.", body: "The outreach connected food staples with household nutrition conversations so families received immediate relief and practical guidance." },
      { id: "act-3", title: "Volunteer Wellness Planning Workshop", category: "Workshop", date: "2026-07-05", location: "Foundation office", image: "assets/images/volunteer-workshop.png", summary: "Healthcare volunteers and community workers planned upcoming food and health outreach activities.", body: "The session prepared teams for registration, beneficiary handling, health messaging, and transparent reporting." }
    ],
    applications: [],
    helpRequests: [],
    passwordResets: []
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function localRead() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      localStorage.setItem(DB_KEY, JSON.stringify(seed));
      return clone(seed);
    }
    return JSON.parse(raw);
  }

  function localWrite(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  function publicImage(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    if (location.pathname.includes("/pages/") || location.pathname.includes("/admin/") || location.pathname.includes("/portal/")) {
      return `../${path}`;
    }
    return path;
  }

  function normalizeImage(path) {
    return (path || "").replace(/^\.\.\//, "");
  }

  function toActivity(row) {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      date: row.activity_date || row.date,
      location: row.location,
      image: row.image_url || row.image,
      summary: row.summary,
      body: row.body
    };
  }

  function fromActivity(data) {
    return {
      title: data.title,
      category: data.category,
      activity_date: data.date || new Date().toISOString().slice(0, 10),
      location: data.location,
      image_url: normalizeImage(data.image),
      summary: data.summary,
      body: data.body
    };
  }

  async function requireUser() {
    if (!client) return null;
    const { data, error } = await client.auth.getUser();
    if (error) return null;
    return data.user;
  }

  async function getProfile(userId) {
    const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();
    if (error) throw error;
    return data;
  }

  window.MHFFStore = {
    isSupabaseEnabled: hasSupabase,
    supabase: client,
    uid,
    publicImage,
    normalizeImage,
    async read() {
      if (!client) return localRead();
      const [activities, applications, helpRequests] = await Promise.all([
        client.from("activities").select("*").order("activity_date", { ascending: false }).order("created_at", { ascending: false }),
        client.from("volunteer_applications").select("*").order("created_at", { ascending: false }),
        client.from("help_requests").select("*").order("created_at", { ascending: false })
      ]);
      if (activities.error) throw activities.error;
      if (applications.error) throw applications.error;
      if (helpRequests.error) throw helpRequests.error;
      return {
        users: [],
        activities: activities.data.map(toActivity),
        applications: applications.data,
        helpRequests: helpRequests.data,
        passwordResets: []
      };
    },
    async getSession() {
      if (!client) {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
      }
      const user = await requireUser();
      if (!user) return null;
      const profile = await getProfile(user.id);
      return { id: user.id, role: profile.role, name: profile.name, email: user.email };
    },
    setSession(user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, role: user.role, name: user.name, email: user.email }));
    },
    async clearSession() {
      if (client) await client.auth.signOut();
      sessionStorage.removeItem(SESSION_KEY);
    },
    async login(email, password, role) {
      if (!client) {
        const db = localRead();
        const user = db.users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password && item.role === role);
        if (!user) return null;
        this.setSession(user);
        return user;
      }
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error || !data.user) return null;
      const profile = await getProfile(data.user.id);
      if (profile.role !== role) {
        await client.auth.signOut();
        return null;
      }
      return { id: data.user.id, role: profile.role, name: profile.name, email: data.user.email };
    },
    async registerVolunteer(data) {
      if (!client) {
        const db = localRead();
        if (db.users.some((user) => user.email.toLowerCase() === data.email.toLowerCase())) throw new Error("An account already exists with this email.");
        const user = { id: uid("vol"), role: "volunteer", createdAt: new Date().toISOString().slice(0, 10), ...data };
        db.users.push(user);
        localWrite(db);
        this.setSession(user);
        return user;
      }
      const { data: authData, error } = await client.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { name: data.name, phone: data.phone, skill: data.skill, role: "volunteer" } }
      });
      if (error) throw error;
      return authData.user;
    },
    async requestPasswordReset(email, role) {
      if (!client) {
        const db = localRead();
        const reset = { id: uid("reset"), email, role, createdAt: new Date().toISOString(), status: "pending" };
        db.passwordResets.unshift(reset);
        localWrite(db);
        return reset;
      }
      const redirectTo = location.href.replace(/forgot-password\.html.*/, "login.html");
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      return { email, role, status: "sent" };
    },
    async saveActivity(data) {
      if (!client) {
        const db = localRead();
        const item = { id: data.id || uid("act"), date: data.date || new Date().toISOString().slice(0, 10), ...data, image: normalizeImage(data.image) };
        const index = db.activities.findIndex((activity) => activity.id === item.id);
        if (index >= 0) db.activities[index] = item;
        else db.activities.unshift(item);
        localWrite(db);
        return item;
      }
      const user = await requireUser();
      const payload = { ...fromActivity(data), created_by: user ? user.id : null };
      const { data: row, error } = await client.from("activities").insert(payload).select("*").single();
      if (error) throw error;
      return toActivity(row);
    },
    async deleteActivity(id) {
      if (!client) {
        const db = localRead();
        db.activities = db.activities.filter((item) => item.id !== id);
        localWrite(db);
        return;
      }
      const { error } = await client.from("activities").delete().eq("id", id);
      if (error) throw error;
    },
    async submitApplication(data) {
      if (!client) {
        const db = localRead();
        const item = { id: uid("app"), status: "Submitted", createdAt: new Date().toISOString(), ...data };
        db.applications.unshift(item);
        localWrite(db);
        return item;
      }
      const user = await requireUser();
      const payload = {
        user_id: user ? user.id : null,
        name: data.name,
        email: data.email || (user ? user.email : ""),
        role: data.role,
        availability: data.availability,
        message: data.message
      };
      const { data: row, error } = await client.from("volunteer_applications").insert(payload).select("*").single();
      if (error) throw error;
      return row;
    },
    async submitHelpRequest(data) {
      if (!client) {
        const db = localRead();
        const item = { id: uid("help"), status: "New", createdAt: new Date().toISOString(), ...data };
        db.helpRequests.unshift(item);
        localWrite(db);
        return item;
      }
      const user = await requireUser();
      const payload = {
        user_id: user ? user.id : null,
        name: data.name,
        phone: data.phone,
        community: data.community,
        request_type: data.requestType,
        message: data.message
      };
      const { data: row, error } = await client.from("help_requests").insert(payload).select("*").single();
      if (error) throw error;
      return row;
    }
  };
})();
