"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "./api";
import type { ProjectsListParams } from "./types";
import type { ProjectUpdateBody } from "./api";

const projectsKey = ["projects"] as const;

export function useProjectsList(params?: ProjectsListParams) {
  return useQuery({
    queryKey: [...projectsKey, "list", params],
    queryFn: () => projectsApi.list(params),
  });
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: [...projectsKey, id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  });
}

export function useProjectDetail(idOrSlug: string | null) {
  return useQuery({
    queryKey: [...projectsKey, "detail", idOrSlug],
    queryFn: () => projectsApi.getDetail(idOrSlug!),
    enabled: !!idOrSlug,
  });
}

export type CreateProjectBody = {
  name: string;
  description?: string;
  memberIds?: string[];
  links?: import("./types").ProjectLinkItem[];
  githubRepoFullName?: string;
  githubRepoUrl?: string;
};

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateProjectBody) => {
      const project = await projectsApi.create({
        name: body.name,
        description: body.description,
        links: body.links,
        githubRepoFullName: body.githubRepoFullName,
        githubRepoUrl: body.githubRepoUrl,
      });
      for (const memberId of body.memberIds ?? []) {
        await projectsApi.addMember(project.id, memberId);
      }
      return project;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey }),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProjectUpdateBody) => projectsApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectsKey });
      qc.invalidateQueries({ queryKey: [...projectsKey, id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey }),
  });
}

export function useProjectMembers(projectId: string | null) {
  return useQuery({
    queryKey: [...projectsKey, projectId, "members"],
    queryFn: () => projectsApi.listMembers(projectId!),
    enabled: !!projectId,
  });
}

export function useAddProjectMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => projectsApi.addMember(projectId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectsKey });
      qc.invalidateQueries({ queryKey: [...projectsKey, projectId] });
    },
  });
}

export function useRemoveProjectMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => projectsApi.removeMember(projectId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectsKey });
      qc.invalidateQueries({ queryKey: [...projectsKey, projectId] });
    },
  });
}

export function useProjectFiles(projectId: string | null, params?: { search?: string }) {
  return useQuery({
    queryKey: [...projectsKey, projectId, "files", params?.search ?? ""],
    queryFn: () => projectsApi.listFiles(projectId!, params),
    enabled: !!projectId,
  });
}

export function useAddProjectFile(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: File | { file: File; folder?: string }) =>
      input instanceof File
        ? projectsApi.addFile(projectId, input)
        : projectsApi.addFile(projectId, input.file, input.folder),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectsKey });
      qc.invalidateQueries({ queryKey: [...projectsKey, projectId] });
      qc.invalidateQueries({ queryKey: [...projectsKey, projectId, "files"] });
      qc.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useAddProjectFileByUrl(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { fileName: string; fileUrl: string; fileType?: string; fileSize?: number }) =>
      projectsApi.addFileByUrl(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectsKey });
      qc.invalidateQueries({ queryKey: [...projectsKey, projectId] });
      qc.invalidateQueries({ queryKey: [...projectsKey, projectId, "files"] });
    },
  });
}

export function useDeleteProjectFile(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => projectsApi.deleteFile(projectId, fileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectsKey });
      qc.invalidateQueries({ queryKey: [...projectsKey, projectId] });
      qc.invalidateQueries({ queryKey: [...projectsKey, projectId, "files"] });
      qc.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useProjectInsights(projectId: string | null) {
  return useQuery({
    queryKey: [...projectsKey, projectId, "insights"],
    queryFn: () => projectsApi.getInsights(projectId!),
    enabled: !!projectId,
  });
}

export function useProjectMilestones(projectId: string | null) {
  return useQuery({
    queryKey: [...projectsKey, projectId, "milestones"],
    queryFn: () => projectsApi.listMilestones(projectId!),
    enabled: !!projectId,
  });
}

export function useAddMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string | null; dueAt?: string | null }) =>
      projectsApi.addMilestone(projectId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...projectsKey, projectId, "milestones"] }),
  });
}

export function useUpdateMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, body }: { milestoneId: string; body: Partial<{ name: string; description: string | null; dueAt: string | null; completed: boolean }> }) =>
      projectsApi.updateMilestone(projectId, milestoneId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...projectsKey, projectId, "milestones"] }),
  });
}

export function useDeleteMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) => projectsApi.deleteMilestone(projectId, milestoneId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...projectsKey, projectId, "milestones"] }),
  });
}
