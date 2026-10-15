import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Sparkles, Users } from "lucide-react";
import {
  createTeam,
  deleteTeam,
  getMyTeams,
} from "../../services/team.service.js";
import { getApiError, unwrapApiList } from "../../utils/apiData.js";
import {
  AvatarGroup,
  EmptyState,
  FilterBar,
  LoadingState,
  PageHeader,
  SectionCard,
} from "../../components/ui/Shared.jsx";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });

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
    loadTeams();
  }, []);

  const remove = async (id) => {
    try {
      await deleteTeam(id);
      setTeams((items) => items.filter((item) => item._id !== id));
      toast.success("Team deleted");
    } catch (error) {
      toast.error(getApiError(error, "Could not delete team"));
    }
  };

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

  const visibleTeams = teams.filter((team) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      team.name?.toLowerCase().includes(query) ||
      team.description?.toLowerCase().includes(query)
    );
  });

  if (loading) return <LoadingState text="Loading teams..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Teams"
        subtitle="Manage your people, projects, and collaboration groups."
        action={
          <Link
            to="/teams/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            New team
          </Link>
        }
      />

      <SectionCard title="Create team" icon={Sparkles}>
        <form
          onSubmit={create}
          className="grid gap-4 p-5 lg:grid-cols-[1.2fr_1.2fr_auto]"
        >
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
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

      <FilterBar>
        <div className="relative w-full sm:max-w-xs">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search teams"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
          />
        </div>
      </FilterBar>

      {visibleTeams.length ? (
        <SectionCard>
          <div className="divide-y divide-slate-100 ">
            {visibleTeams.map((team) => (
              <div
                key={team._id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600  ">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/teams/${team._id}`}
                      className="block truncate text-sm font-semibold text-slate-900 transition hover:text-blue-600 "
                    >
                      {team.name}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500 ">
                      {team.members?.length || 0} members
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <AvatarGroup
                    participants={team.members || []}
                    extra={0}
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => remove(team._id)}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100   "
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : (
        <SectionCard>
          <EmptyState
            icon={Users}
            title="No teams yet"
            description="Create a team and invite collaborators to get started."
          />
        </SectionCard>
      )}
    </div>
  );
}
