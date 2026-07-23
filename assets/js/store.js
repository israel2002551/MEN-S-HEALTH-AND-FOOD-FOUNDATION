(function () {
  const DB_KEY = "mhff_database_v1";
  const SESSION_KEY = "mhff_session_v1";

  const seed = {
    users: [
      { id: "admin-1", role: "admin", name: "Site Administrator", email: "admin@mhff.org", password: "admin123", phone: "+2347044250591", createdAt: "2026-07-23" },
      { id: "vol-1", role: "volunteer", name: "Demo Volunteer", email: "volunteer@mhff.org", password: "volunteer123", phone: "+2347000000000", skill: "Community worker", createdAt: "2026-07-23" }
    ],
    activities: [
      {
        id: "act-1",
        title: "Men's Preventive Health Screening Camp",
        category: "Health Screening",
        date: "2026-07-20",
        location: "Ovia, Edo State",
        image: "assets/images/health-screening.png",
        summary: "Free blood pressure checks, glucose screening, and health education for adult men and families.",
        body: "Volunteers supported a community screening exercise focused on early detection, health literacy, and practical referral guidance."
      },
      {
        id: "act-2",
        title: "Emergency Food Assistance Outreach",
        category: "Food Drive",
        date: "2026-07-14",
        location: "Benin City, Edo State",
        image: "assets/images/food-distribution.png",
        summary: "Food packs were distributed to vulnerable households with nutrition education support.",
        body: "The outreach connected food staples with household nutrition conversations so families received immediate relief and practical guidance."
      },
      {
        id: "act-3",
        title: "Volunteer Wellness Planning Workshop",
        category: "Workshop",
        date: "2026-07-05",
        location: "Foundation office",
        image: "assets/images/volunteer-workshop.png",
        summary: "Healthcare volunteers and community workers planned upcoming food and health outreach activities.",
        body: "The session prepared teams for registration, beneficiary handling, health messaging, and transparent reporting."
      }
    ],
    applications: [],
    helpRequests: [],
    passwordResets: []
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function read() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      localStorage.setItem(DB_KEY, JSON.stringify(seed));
      return clone(seed);
    }
    return JSON.parse(raw);
  }

  function write(db) {
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

  window.MHFFStore = {
    read,
    write,
    uid,
    publicImage,
    normalizeImage,
    getSession() {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    },
    setSession(user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, role: user.role, name: user.name, email: user.email }));
    },
    clearSession() {
      sessionStorage.removeItem(SESSION_KEY);
    },
    login(email, password, role) {
      const db = read();
      const user = db.users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password && item.role === role);
      if (!user) return null;
      this.setSession(user);
      return user;
    },
    registerVolunteer(data) {
      const db = read();
      if (db.users.some((user) => user.email.toLowerCase() === data.email.toLowerCase())) {
        throw new Error("An account already exists with this email.");
      }
      const user = { id: uid("vol"), role: "volunteer", createdAt: new Date().toISOString().slice(0, 10), ...data };
      db.users.push(user);
      write(db);
      this.setSession(user);
      return user;
    },
    requestPasswordReset(email, role) {
      const db = read();
      const user = db.users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.role === role);
      const reset = { id: uid("reset"), email, role, createdAt: new Date().toISOString(), status: user ? "matched" : "pending" };
      db.passwordResets.unshift(reset);
      write(db);
      return reset;
    },
    saveActivity(data) {
      const db = read();
      const item = { id: data.id || uid("act"), date: data.date || new Date().toISOString().slice(0, 10), ...data, image: normalizeImage(data.image) };
      const index = db.activities.findIndex((activity) => activity.id === item.id);
      if (index >= 0) db.activities[index] = item;
      else db.activities.unshift(item);
      write(db);
      return item;
    },
    deleteActivity(id) {
      const db = read();
      db.activities = db.activities.filter((item) => item.id !== id);
      write(db);
    },
    submitApplication(data) {
      const db = read();
      const item = { id: uid("app"), status: "Submitted", createdAt: new Date().toISOString(), ...data };
      db.applications.unshift(item);
      write(db);
      return item;
    },
    submitHelpRequest(data) {
      const db = read();
      const item = { id: uid("help"), status: "New", createdAt: new Date().toISOString(), ...data };
      db.helpRequests.unshift(item);
      write(db);
      return item;
    }
  };
})();
