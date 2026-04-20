import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { freelancerApi, optionsApi } from "@/services/api";
import { Input, Textarea } from "@/components/common/Input";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { Button } from "@/components/common/Button";
import { toast } from "@/components/common/Toast";
import { Loader2, Save } from "lucide-react";
import { ReviewStars } from "@/components/freelancer/ReviewStars";

const ProfileEdit = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState({
    bio: "",
    experience: "",
    starting_price: "",
    skill_id: "",
  });

  const load = async () => {
    if (!user?.freelancer_id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await freelancerApi.getProfile(user.freelancer_id);
      const data = response.data || null;
      setProfile(data);
      if (data) {
        setForm({
          bio: data.bio || "",
          experience: data.experience_yrs ?? "",
          starting_price: data.starting_price ?? "",
          skill_id: "",
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.freelancer_id]);

  useEffect(() => {
    optionsApi.skills()
      .then((skillResponse) => {
        setSkills(skillResponse.data || []);
      })
      .catch((e) => setError(e.message));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (profile) {
        await freelancerApi.updateProfile(profile.freelancer_id, {
          experience: Number(form.experience),
          bio: form.bio,
          starting_price: Number(form.starting_price),
        });
        toast.success("Profile updated");
        load();
      } else {
        const payload = {
          starting_price: Number(form.starting_price),
          skill_id: Number(form.skill_id),
        };

        if (form.experience !== "") payload.experience = Number(form.experience);
        if (form.bio !== "") payload.bio = form.bio;

        const response = await freelancerApi.createProfile(payload);
        updateUser({ freelancer_id: response.freelancer_id }, response.token);
        toast.success("Profile created");
      }
    } catch (e) {
      setError(e.message);
      toast.error("Save failed", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-[calc(100vh-4rem)]">
      <div className="container py-8 md:py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">
          {profile ? "Edit Profile" : "Create Profile"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Profile data is submitted directly to the backend.
        </p>

        {error && (
          <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {profile && (
          <div className="mt-6 bg-card border border-border rounded-2xl p-6 shadow-card">
            <div className="font-semibold text-foreground">{profile.name}</div>
            <div className="text-sm text-muted-foreground">{profile.email}</div>
            <div className="text-sm text-primary mt-1">{profile.skill_name}</div>
            <div className="mt-2">
              <ReviewStars
                rating={profile.avg_rating}
                count={profile.total_reviews}
                showValue
              />
            </div>
          </div>
        )}

        <div className="mt-6 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
          <form onSubmit={submit} className="space-y-5">
            {!profile && (
              <div className="grid gap-5">
                <SearchableSelect
                  label="Skill"
                  value={form.skill_id}
                  onChange={(skill_id) => setForm({ ...form, skill_id })}
                  required
                  options={skills}
                  getValue={(skill) => skill.skill_id}
                  getLabel={(skill) => skill.skill_name}
                />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              <Input
                label="experience"
                type="number"
                min={0}
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
              />

              <Input
                label="starting_price"
                type="number"
                min={1}
                value={form.starting_price}
                onChange={(e) =>
                  setForm({ ...form, starting_price: e.target.value })
                }
                required
              />
            </div>

            <Textarea
              label="bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={6}
            />

            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                <Save className="h-4 w-4" /> Save
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
