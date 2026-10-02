import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Plus, Sparkles, Users } from "lucide-react";
import {
  createTeam,
  deleteTeam,
  getMyTeams,
  getTeamById,
} from "../../services/team.service.js";
import {
  getApiError,
  unwrapApiData,
  unwrapApiList,
} from "../../utils/apiData.js";
import {
  AvatarGroup,
  EmptyState,
  LoadingState,
  PageHeader,
  SectionCard,
} from "../../components/ui/Shared.jsx";

export default function TeamDetails() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);

  const loadTeams = async () => {
    try {
      const response = await getMyTeams();
      setTeams(unwrapApiList(response));
    } catch (error) {
      toast.error(getApiError(error, "Could not load teams"));
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!teamId) {
      loadTeams();
      return;
    }

    getTeamById(teamId)
      .then((response) => setTeam(unwrapApiData(response) || null))
      .catch((error) => {
        toast.error(getApiError(error, "Could not load team"));
        setTeam(null);
      })
      .finally(() => setLoading(false));
  }, [teamId]);

  const create = async (event) => {
    event.preventDefault();
    try {
      await createTeam(form);
      setForm({ name: "", description: "" });
      toast.success("Team created");
      await loadTeams();
    } catch (error) {
      toast.error(getApiError(error, "Could not create team"));
    }
  };

  const remove = async (id) => {
    try {
      await deleteTeam(id);
      setTeams((items) => items.filter((item) => item._id !== id));
      toast.success("Team deleted");
    } catch (error) {
      toast.error(getApiError(error, "Could not delete team"));
    }
  };

  if (loading) return <LoadingState text="Loading team..." />;

  if (!teamId) {
    return (
      <div className="space-y-5">
        <PageHeader title="Teams" subtitle="Manage your workspace teams." />

        <SectionCard title="Create team" icon={Sparkles}>
          <form
            onSubmit={create}
            className="grid gap-4 p-5 lg:grid-cols-[1.2fr_1.2fr_auto]"
          >
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Team name"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
            />
            <input
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="Short description"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
          </form>
        </SectionCard>

        <SectionCard>
          <div className="divide-y divide-slate-100 ">
            {teams.length ? (
              teams.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between gap-4 p-4 sm:p-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600  ">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/teams/${item._id}`}
                        className="block truncate font-semibold text-slate-900 "
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-slate-500 ">
                        {item.members?.length || 0} members
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item._id)}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100   "
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Users}
                title="No teams"
                description="Create a team to get started."
              />
            )}
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        to="/teams"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:underline "
      >
        <ArrowLeft className="h-4 w-4" />
        Back to teams
      </Link>

      <PageHeader
        title={team?.name || "Team"}
        subtitle={team?.description || "Your team workspace."}
      />

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <SectionCard title="Members" icon={Users}>
          {team?.members?.length ? (
            <div className="divide-y divide-slate-100 ">
              {team.members.map((member) => (
                <div
                  key={member._id || member.email || member.fullName}
                  className="flex items-center justify-between gap-3 p-4 sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-violet-600 text-sm font-bold text-white">
                      {(member.fullName || "U")[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 ">
                        {member.fullName || "Team member"}
                      </p>
                      <p className="text-xs text-slate-500 ">
                        {member.email || "Member"}
                      </p>
                    </div>
                  </div>
                  <AvatarGroup
                    participants={[member.fullName || "U"]}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No members yet"
              description="Invite teammates to join this workspace."
            />
          )}
        </SectionCard>

        <SectionCard title="Summary" icon={Sparkles}>
          <div className="space-y-4 p-5">
            <div className="rounded-xl bg-slate-50 p-4 ">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Team
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900 ">
                {team?.name || "Workspace"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 ">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Members
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900 ">
                {team?.members?.length || 0}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
