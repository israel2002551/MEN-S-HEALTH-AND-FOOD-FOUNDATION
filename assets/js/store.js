(function () {
  const DB_KEY = "mhff_database_v1";
  const SESSION_KEY = "mhff_session_v1";
  const config = window.MHFF_SUPABASE_CONFIG || {};
  const hasSupabase = Boolean(config.url && config.anonKey && window.supabase);
  const client = hasSupabase ? window.supabase.createClient(config.url, config.anonKey) : null;
  const MEDIA_BUCKET = "ngo-media";

  const seed = {
    users: [
      { id: "admin-1", role: "admin", name: "Site Administrator", email: "gojariafe@gmail.com", password: "admin123", phone: "+2347044250591", skill: "Administration", createdAt: "2026-07-23" },
      { id: "vol-1", role: "volunteer", name: "Demo Volunteer", email: "israelefe093@gmail.com", password: "volunteer123", phone: "+2347000000000", skill: "Community worker", createdAt: "2026-07-23" }
    ],
    activities: [
      { id: "act-1", title: "Men's Preventive Health Screening Camp", category: "Health Screening", date: "2026-07-20", location: "Ovia, Edo State", image: "assets/images/health-screening.png", video: "", summary: "Free blood pressure checks, glucose screening, and health education for adult men and families.", body: "Volunteers supported a community screening exercise focused on early detection, health literacy, and practical referral guidance." },
      { id: "act-2", title: "Emergency Food Assistance Outreach", category: "Food Drive", date: "2026-07-14", location: "Benin City, Edo State", image: "assets/images/food-distribution.png", video: "", summary: "Food packs were distributed to vulnerable households with nutrition education support.", body: "The outreach connected food staples with household nutrition conversations so families received immediate relief and practical guidance." },
      { id: "act-3", title: "Volunteer Wellness Planning Workshop", category: "Workshop", date: "2026-07-05", location: "Foundation office", image: "assets/images/volunteer-workshop.png", video: "", summary: "Healthcare volunteers and community workers planned upcoming food and health outreach activities.", body: "The session prepared teams for registration, beneficiary handling, health messaging, and transparent reporting." }
    ],
    programs: [
      { id: "prog-1", title: "Preventive Health Screening", category: "Health", image: "assets/images/health-screening.png", video: "", summary: "Men's health awareness, BP checks, glucose checks, mental health conversations, and referral guidance.", body: "Screening programs help men and families identify risks early and connect to basic health education." },
      { id: "prog-2", title: "Emergency Food Assistance", category: "Food Security", image: "assets/images/food-distribution.png", video: "", summary: "Food distribution for vulnerable households, low-income families, and community representatives.", body: "Food drives provide immediate relief while reinforcing practical household nutrition education." },
      { id: "prog-3", title: "Community Wellness Workshops", category: "Wellness", image: "assets/images/volunteer-workshop.png", video: "", summary: "Nutrition, hygiene, chronic illness prevention, volunteer training, and family wellbeing education.", body: "Workshops build local knowledge and prepare volunteers for accountable outreach." }
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
    return { ...clone(seed), ...JSON.parse(raw) };
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

  function normalizeMedia(path) {
    return normalizeImage(path).trim();
  }

  function describeError(error) {
    if (!error) return "Unknown error";
    if (typeof error === "string") return error;
    const parts = [
      error.message,
      error.error_description,
      error.error,
      error.status ? `status ${error.status}` : "",
      error.code ? `code ${error.code}` : ""
    ].filter(Boolean);
    if (parts.length) return parts.join(" | ");
    try {
      return JSON.stringify(error);
    } catch (stringifyError) {
      return Object.prototype.toString.call(error);
    }
  }

  function toActivity(row) {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      date: row.activity_date || row.date,
      location: row.location,
      image: row.image_url || row.image,
      video: row.video_url || row.video || "",
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
      video_url: normalizeMedia(data.video),
      summary: data.summary,
      body: data.body
    };
  }

  function fileFrom(data, key) {
    const file = data[key];
    return file && typeof File !== "undefined" && file instanceof File && file.size > 0 ? file : null;
  }

  function safeFileName(fileName) {
    const extension = fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "bin";
    const base = fileName.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "media";
    return `${base}.${extension}`;
  }

  async function uploadMedia(file, folder) {
    if (!file) return "";
    if (!client) throw new Error("Supabase Storage is required for device uploads. Add Supabase config first.");
    const user = await requireUser();
    if (!user) throw new Error("Please log in before uploading media.");
    const path = `${folder}/${user.id}/${Date.now()}-${safeFileName(file.name)}`;
    const { error } = await client.storage.from(MEDIA_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined
    });
    if (error) throw new Error(`Storage upload failed: ${describeError(error)}`);
    const { data } = client.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  function withoutFiles(data) {
    const copy = { ...data };
    delete copy.imageFile;
    delete copy.videoFile;
    return copy;
  }

  async function activityPayload(data) {
    const imageUpload = await uploadMedia(fileFrom(data, "imageFile"), "activities/images");
    const videoUpload = await uploadMedia(fileFrom(data, "videoFile"), "activities/videos");
    return {
      ...fromActivity(data),
      image_url: imageUpload || normalizeImage(data.image),
      video_url: videoUpload || normalizeMedia(data.video)
    };
  }

  function toProgram(row) {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      image: row.image_url || row.image,
      video: row.video_url || row.video || "",
      summary: row.summary,
      body: row.body
    };
  }

  function fromProgram(data) {
    return {
      title: data.title,
      category: data.category,
      image_url: normalizeImage(data.image),
      video_url: normalizeMedia(data.video),
      summary: data.summary,
      body: data.body
    };
  }

  async function programPayload(data) {
    const imageUpload = await uploadMedia(fileFrom(data, "imageFile"), "programs/images");
    const videoUpload = await uploadMedia(fileFrom(data, "videoFile"), "programs/videos");
    return {
      ...fromProgram(data),
      image_url: imageUpload || normalizeImage(data.image),
      video_url: videoUpload || normalizeMedia(data.video)
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
    normalizeMedia,
    async read() {
      if (!client) return localRead();
      const [activities, programs, applications, helpRequests] = await Promise.all([
        client.from("activities").select("*").order("activity_date", { ascending: false }).order("created_at", { ascending: false }),
        client.from("programs").select("*").order("created_at", { ascending: true }),
        client.from("volunteer_applications").select("*").order("created_at", { ascending: false }),
        client.from("help_requests").select("*").order("created_at", { ascending: false })
      ]);
      if (activities.error) throw activities.error;
      const programRows = programs.error ? seed.programs : programs.data;
      if (applications.error) throw applications.error;
      if (helpRequests.error) throw helpRequests.error;
      return {
        users: [],
        activities: activities.data.map(toActivity),
        programs: programRows.map(toProgram),
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
      if (error) throw new Error(`Supabase auth: ${describeError(error)}`);
      if (!data.user) throw new Error("Supabase auth did not return a user.");
      let profile;
      try {
        profile = await getProfile(data.user.id);
      } catch (error) {
        await client.auth.signOut();
        throw new Error(`Profile lookup failed: ${describeError(error)}. Confirm this user has a row in public.profiles.`);
      }
      if (profile.role !== role) {
        await client.auth.signOut();
        throw new Error(`This account is registered as "${profile.role}", not "${role}".`);
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
        if (fileFrom(data, "imageFile") || fileFrom(data, "videoFile")) throw new Error("Device uploads require Supabase Storage.");
        const clean = withoutFiles(data);
        const item = { id: clean.id || uid("act"), date: clean.date || new Date().toISOString().slice(0, 10), ...clean, image: normalizeImage(clean.image), video: normalizeMedia(clean.video) };
        const index = db.activities.findIndex((activity) => activity.id === item.id);
        if (index >= 0) db.activities[index] = item;
        else db.activities.unshift(item);
        localWrite(db);
        return item;
      }
      const user = await requireUser();
      const payload = { ...(await activityPayload(data)), created_by: user ? user.id : null };
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
    async saveProgram(data) {
      if (!client) {
        const db = localRead();
        if (fileFrom(data, "imageFile") || fileFrom(data, "videoFile")) throw new Error("Device uploads require Supabase Storage.");
        const clean = withoutFiles(data);
        db.programs = db.programs || [];
        const item = { id: clean.id || uid("prog"), ...clean, image: normalizeImage(clean.image), video: normalizeMedia(clean.video) };
        const index = db.programs.findIndex((program) => program.id === item.id);
        if (index >= 0) db.programs[index] = item;
        else db.programs.push(item);
        localWrite(db);
        return item;
      }
      const user = await requireUser();
      const payload = { ...(await programPayload(data)), created_by: user ? user.id : null };
      const { data: row, error } = await client.from("programs").insert(payload).select("*").single();
      if (error) throw error;
      return toProgram(row);
    },
    async deleteProgram(id) {
      if (!client) {
        const db = localRead();
        db.programs = (db.programs || []).filter((item) => item.id !== id);
        localWrite(db);
        return;
      }
      const { error } = await client.from("programs").delete().eq("id", id);
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
