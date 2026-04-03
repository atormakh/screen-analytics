export interface Snapshot {
  timestamp: string;
  summary: string;
  path: string;
  tags: string[];
}

export interface SnapshotPayload {
  path: string;
  timestamp: string;
}
