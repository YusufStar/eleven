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

export type CreateProjectBody = {
  name: string;
  description?: string;
  memberIds?: string[];
  links?: import("./types").ProjectLinkItem[];
};

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateProjectBody) => {
      const project = await projectsApi.create({
        name: body.name,
        description: body.description,
        links: body.links,
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
    mutationFn: (file: File) => projectsApi.addFile(projectId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectsKey });
      qc.invalidateQueries({ queryKey: [...projectsKey, projectId] });
      qc.invalidateQueries({ queryKey: [...projectsKey, projectId, "files"] });
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
    },
  });
}
