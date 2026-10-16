// frontend/src/components/project/ProjectFilesPanel.jsx
import { useRef, useState } from "react";
import {
  FileText, Upload, X, Loader2, Trash2, RefreshCw, Download,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  addProjectFiles,
  deleteProjectFile,
  replaceProjectFile,
} from "../../services/project.service.js";
import { getApiError, unwrapApiData } from "../../utils/apiData.js";

const MAX_FILES_PER_PROJECT = 10;
const MAX_FILES_PER_REQUEST = 5;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 ? 2 : 0)} ${units[i]}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProjectFilesPanel({
  project,
  canManage,
  onUpdated,
}) {
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [replacingId, setReplacingId] = useState(null);
  const addInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const replaceTargetRef = useRef(null);

  const files = project?.files || [];
  const atLimit = files.length >= MAX_FILES_PER_PROJECT;

  const handleAddFiles = async (e) => {
    const chosen = Array.from(e.target.files || []);
    e.target.value = "";
    if (chosen.length === 0) return;

    if (chosen.length > MAX_FILES_PER_REQUEST) {
      toast.error(`Max ${MAX_FILES_PER_REQUEST} files per upload`);
      return;
    }
    if (files.length + chosen.length > MAX_FILES_PER_PROJECT) {
      toast.error(`Max ${MAX_FILES_PER_PROJECT} files per project`);
      return;
    }
    for (const f of chosen) {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`"${f.name}" exceeds 100 MB`);
        return;
      }
    }

    setUploading(true);
    try {
      const response = await addProjectFiles(project._id, chosen);
      onUpdated?.(unwrapApiData(response));
      toast.success(`${chosen.length} file(s) uploaded`);
    } catch (err) {
      toast.error(getApiError(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (file) => {
    if (!window.confirm(`Remove "${file.name}"? This cannot be undone.`))
      return;
    setRemovingId(file._id);
    try {
      const response = await deleteProjectFile(project._id, file._id);
      onUpdated?.(unwrapApiData(response));
      toast.success("File removed");
    } catch (err) {
      toast.error(getApiError(err, "Could not remove file"));
    } finally {
      setRemovingId(null);
    }
  };

  const handleReplaceClick = (file) => {
    replaceTargetRef.current = file;
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = async (e) => {
    const chosen = e.target.files?.[0];
    e.target.value = "";
    const target = replaceTargetRef.current;
    replaceTargetRef.current = null;

    if (!chosen || !target) return;
    if (chosen.size > MAX_FILE_SIZE) {
      toast.error("File exceeds 100 MB");
      return;
    }

    setReplacingId(target._id);
    try {
      const response = await replaceProjectFile(
        project._id,
        target._id,
        chosen
      );
      onUpdated?.(unwrapApiData(response));
      toast.success("File replaced");
    } catch (err) {
      toast.error(getApiError(err, "Could not replace file"));
    } finally {
      setReplacingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent-blue" />
          <h3 className="text-sm font-semibold text-fg">
            Files ({files.length}/{MAX_FILES_PER_PROJECT})
          </h3>
        </div>

        {canManage && (
          <>
            <input
              ref={addInputRef}
              type="file"
              multiple
              hidden
              onChange={handleAddFiles}
            />
            <button
              type="button"
              disabled={uploading || atLimit}
              onClick={() => addInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold text-white transition"
            >
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              {uploading ? "Uploading..." : "Add Files"}
            </button>
          </>
        )}
      </div>

      {/* Hidden input for replace */}
      <input
        ref={replaceInputRef}
        type="file"
        hidden
        onChange={handleReplaceFile}
      />

      {files.length === 0 ? (
        <div className="p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
            <FileText className="h-5 w-5 text-fg-3" />
          </div>
          <p className="text-sm font-medium text-fg-2">No files yet</p>
          <p className="mt-1 text-xs text-fg-3 max-w-sm mx-auto">
            {canManage
              ? "Upload project files to keep everything in one place."
              : "No files have been shared on this project."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-line">
          {files.map((file) => {
            const isRemoving = removingId === file._id;
            const isReplacing = replacingId === file._id;
            return (
              <div
                key={file._id}
                className="flex items-center gap-3 p-3 hover:bg-surface/50 transition"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10">
                  <FileText className="h-4 w-4 text-accent-blue" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-fg-3 truncate">
                    {formatBytes(file.size)} · Uploaded{" "}
                    {formatDate(file.uploadedAt)}
                  </p>
                </div>

                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-card hover:bg-surface transition"
                  title="Download / open"
                >
                  <Download className="h-3.5 w-3.5 text-fg-2" />
                </a>

                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReplaceClick(file)}
                      disabled={isReplacing || isRemoving}
                      className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-card hover:bg-surface transition disabled:opacity-50"
                      title="Replace"
                    >
                      {isReplacing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-blue" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 text-fg-2" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(file)}
                      disabled={isRemoving || isReplacing}
                      className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-accent-rose/30 bg-accent-rose/10 text-accent-rose hover:bg-accent-rose/20 transition disabled:opacity-50"
                      title="Remove"
                    >
                      {isRemoving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}