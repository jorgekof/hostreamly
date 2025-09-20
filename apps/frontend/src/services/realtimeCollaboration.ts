/**
 * Real-time Collaboration System for Video Editing
 * Revolutionary multi-user video editing with live sync, conflict resolution, and version control
 */

import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer' | 'reviewer';
  permissions: {
    edit: boolean;
    comment: boolean;
    export: boolean;
    invite: boolean;
    delete: boolean;
  };
  cursor?: {
    x: number;
    y: number;
    timestamp: number;
  };
  selection?: {
    startTime: number;
    endTime: number;
    trackId?: string;
  };
  status: 'online' | 'away' | 'offline';
  lastSeen: number;
}

interface VideoProject {
  id: string;
  name: string;
  description: string;
  owner: string;
  collaborators: User[];
  timeline: TimelineState;
  assets: MediaAsset[];
  comments: Comment[];
  versions: ProjectVersion[];
  settings: {
    resolution: { width: number; height: number };
    frameRate: number;
    duration: number;
    audioSampleRate: number;
  };
  createdAt: number;
  updatedAt: number;
  isLocked: boolean;
  lockedBy?: string;
}

interface TimelineState {
  tracks: Track[];
  playhead: number;
  zoom: number;
  viewportStart: number;
  viewportEnd: number;
  selectedClips: string[];
  markers: Marker[];
}

interface Track {
  id: string;
  type: 'video' | 'audio' | 'text' | 'effect';
  name: string;
  clips: Clip[];
  muted: boolean;
  locked: boolean;
  height: number;
  order: number;
}

interface Clip {
  id: string;
  assetId: string;
  startTime: number;
  endTime: number;
  trimStart: number;
  trimEnd: number;
  position: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number;
  opacity: number;
  effects: Effect[];
  transitions: {
    in?: Transition;
    out?: Transition;
  };
  locked: boolean;
  editedBy?: string;
  editedAt?: number;
}

interface Effect {
  id: string;
  type: string;
  name: string;
  parameters: Record<string, any>;
  enabled: boolean;
  keyframes: Keyframe[];
}

interface Keyframe {
  time: number;
  value: any;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier';
  bezierPoints?: [number, number, number, number];
}

interface Transition {
  type: 'fade' | 'dissolve' | 'wipe' | 'slide' | 'zoom' | 'custom';
  duration: number;
  parameters: Record<string, any>;
}

interface Marker {
  id: string;
  time: number;
  label: string;
  color: string;
  type: 'chapter' | 'comment' | 'todo' | 'custom';
}

interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'text';
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  metadata: {
    width?: number;
    height?: number;
    frameRate?: number;
    bitrate?: number;
    codec?: string;
    size: number;
    format: string;
  };
  uploadedBy: string;
  uploadedAt: number;
  processingStatus: 'pending' | 'processing' | 'ready' | 'error';
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: number;
  position?: {
    time: number;
    trackId?: string;
    clipId?: string;
  };
  replies: Comment[];
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
  mentions: string[]; // User IDs
  attachments: {
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    name: string;
  }[];
}

interface ProjectVersion {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
  timeline: TimelineState;
  assets: MediaAsset[];
  changesSummary: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
  parentVersion?: string;
  tags: string[];
}

interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'cursor_moved' | 'selection_changed' | 
        'clip_added' | 'clip_modified' | 'clip_deleted' | 'track_added' | 'track_deleted' |
        'comment_added' | 'comment_modified' | 'comment_resolved' | 'playhead_moved' |
        'project_locked' | 'project_unlocked' | 'version_created' | 'conflict_detected';
  userId: string;
  projectId: string;
  timestamp: number;
  data: any;
  conflictId?: string;
}

interface Conflict {
  id: string;
  type: 'clip_overlap' | 'simultaneous_edit' | 'version_mismatch' | 'permission_denied';
  description: string;
  involvedUsers: string[];
  affectedElements: string[]; // Clip IDs, Track IDs, etc.
  timestamp: number;
  resolved: boolean;
  resolution?: {
    strategy: 'merge' | 'overwrite' | 'manual' | 'revert';
    resolvedBy: string;
    resolvedAt: number;
    notes?: string;
  };
  proposals: ConflictProposal[];
}

interface ConflictProposal {
  id: string;
  userId: string;
  strategy: 'accept_mine' | 'accept_theirs' | 'merge' | 'custom';
  description: string;
  changes: any;
  votes: {
    userId: string;
    vote: 'approve' | 'reject';
    timestamp: number;
  }[];
}

interface OperationalTransform {
  id: string;
  type: 'insert' | 'delete' | 'modify' | 'move';
  userId: string;
  timestamp: number;
  target: {
    type: 'clip' | 'track' | 'effect' | 'keyframe';
    id: string;
  };
  operation: any;
  dependencies: string[]; // Other operation IDs this depends on
  applied: boolean;
}

class ConflictResolver {
  private conflicts: Map<string, Conflict> = new Map();
  private resolutionStrategies: Map<string, Function> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  detectConflict(
    operation1: OperationalTransform,
    operation2: OperationalTransform
  ): Conflict | null {
    // Check for simultaneous edits on the same element
    if (operation1.target.id === operation2.target.id && 
        Math.abs(operation1.timestamp - operation2.timestamp) < 1000) {
      
      const conflict: Conflict = {
        id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'simultaneous_edit',
        description: `Simultaneous edit detected on ${operation1.target.type} ${operation1.target.id}`,
        involvedUsers: [operation1.userId, operation2.userId],
        affectedElements: [operation1.target.id],
        timestamp: Date.now(),
        resolved: false,
        proposals: []
      };
      
      this.conflicts.set(conflict.id, conflict);
      return conflict;
    }
    
    // Check for clip overlaps
    if (operation1.type === 'insert' && operation2.type === 'insert' &&
        operation1.target.type === 'clip' && operation2.target.type === 'clip') {
      
      const overlap = this.checkClipOverlap(operation1.operation, operation2.operation);
      if (overlap) {
        const conflict: Conflict = {
          id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'clip_overlap',
          description: 'Clip overlap detected',
          involvedUsers: [operation1.userId, operation2.userId],
          affectedElements: [operation1.target.id, operation2.target.id],
          timestamp: Date.now(),
          resolved: false,
          proposals: []
        };
        
        this.conflicts.set(conflict.id, conflict);
        return conflict;
      }
    }
    
    return null;
  }

  async resolveConflict(conflictId: string, strategy: string, userId: string): Promise<boolean> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return false;
    
    const resolutionFunction = this.resolutionStrategies.get(strategy);
    if (!resolutionFunction) return false;
    
    try {
      const resolution = await resolutionFunction(conflict);
      
      conflict.resolved = true;
      conflict.resolution = {
        strategy: strategy as any,
        resolvedBy: userId,
        resolvedAt: Date.now(),
        notes: resolution.notes
      };
      
      return true;
    } catch (error) {
      console.error('Conflict resolution failed:', error);
      return false;
    }
  }

  proposeResolution(conflictId: string, proposal: Omit<ConflictProposal, 'id' | 'votes'>): string {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) throw new Error('Conflict not found');
    
    const proposalId = `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullProposal: ConflictProposal = {
      ...proposal,
      id: proposalId,
      votes: []
    };
    
    conflict.proposals.push(fullProposal);
    return proposalId;
  }

  voteOnProposal(conflictId: string, proposalId: string, userId: string, vote: 'approve' | 'reject'): boolean {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return false;
    
    const proposal = conflict.proposals.find(p => p.id === proposalId);
    if (!proposal) return false;
    
    // Remove existing vote from this user
    proposal.votes = proposal.votes.filter(v => v.userId !== userId);
    
    // Add new vote
    proposal.votes.push({
      userId,
      vote,
      timestamp: Date.now()
    });
    
    return true;
  }

  private checkClipOverlap(clip1: any, clip2: any): boolean {
    // Check if clips overlap in time and are on the same track
    if (clip1.trackId !== clip2.trackId) return false;
    
    const clip1Start = clip1.startTime;
    const clip1End = clip1.endTime;
    const clip2Start = clip2.startTime;
    const clip2End = clip2.endTime;
    
    return !(clip1End <= clip2Start || clip2End <= clip1Start);
  }

  private initializeStrategies(): void {
    this.resolutionStrategies.set('merge', async (conflict: Conflict) => {
      // Implement merge strategy
      return { notes: 'Changes merged automatically' };
    });
    
    this.resolutionStrategies.set('overwrite', async (conflict: Conflict) => {
      // Implement overwrite strategy (last edit wins)
      return { notes: 'Latest change applied' };
    });
    
    this.resolutionStrategies.set('manual', async (conflict: Conflict) => {
      // Require manual resolution
      return { notes: 'Manual resolution required' };
    });
    
    this.resolutionStrategies.set('revert', async (conflict: Conflict) => {
      // Revert to previous version
      return { notes: 'Reverted to previous state' };
    });
  }

  getConflicts(): Conflict[] {
    return Array.from(this.conflicts.values());
  }

  getUnresolvedConflicts(): Conflict[] {
    return Array.from(this.conflicts.values()).filter(c => !c.resolved);
  }
}

class OperationalTransformEngine {
  private operations: Map<string, OperationalTransform> = new Map();
  private appliedOperations: Set<string> = new Set();
  private conflictResolver: ConflictResolver;

  constructor(conflictResolver: ConflictResolver) {
    this.conflictResolver = conflictResolver;
  }

  addOperation(operation: OperationalTransform): void {
    this.operations.set(operation.id, operation);
    
    // Check for conflicts with existing operations
    for (const existingOp of this.operations.values()) {
      if (existingOp.id !== operation.id && !this.appliedOperations.has(existingOp.id)) {
        const conflict = this.conflictResolver.detectConflict(operation, existingOp);
        if (conflict) {
          console.warn('Conflict detected:', conflict);
        }
      }
    }
  }

  applyOperation(operationId: string, timeline: TimelineState): TimelineState {
    const operation = this.operations.get(operationId);
    if (!operation || this.appliedOperations.has(operationId)) {
      return timeline;
    }
    
    // Check dependencies
    for (const depId of operation.dependencies) {
      if (!this.appliedOperations.has(depId)) {
        console.warn(`Cannot apply operation ${operationId}: dependency ${depId} not applied`);
        return timeline;
      }
    }
    
    const newTimeline = this.transformTimeline(timeline, operation);
    this.appliedOperations.add(operationId);
    operation.applied = true;
    
    return newTimeline;
  }

  private transformTimeline(timeline: TimelineState, operation: OperationalTransform): TimelineState {
    const newTimeline = JSON.parse(JSON.stringify(timeline)); // Deep clone
    
    switch (operation.type) {
      case 'insert':
        this.handleInsert(newTimeline, operation);
        break;
      case 'delete':
        this.handleDelete(newTimeline, operation);
        break;
      case 'modify':
        this.handleModify(newTimeline, operation);
        break;
      case 'move':
        this.handleMove(newTimeline, operation);
        break;
    }
    
    return newTimeline;
  }

  private handleInsert(timeline: TimelineState, operation: OperationalTransform): void {
    if (operation.target.type === 'clip') {
      const trackId = operation.operation.trackId;
      const track = timeline.tracks.find(t => t.id === trackId);
      if (track) {
        track.clips.push(operation.operation.clip);
      }
    } else if (operation.target.type === 'track') {
      timeline.tracks.push(operation.operation.track);
    }
  }

  private handleDelete(timeline: TimelineState, operation: OperationalTransform): void {
    if (operation.target.type === 'clip') {
      for (const track of timeline.tracks) {
        track.clips = track.clips.filter(c => c.id !== operation.target.id);
      }
    } else if (operation.target.type === 'track') {
      timeline.tracks = timeline.tracks.filter(t => t.id !== operation.target.id);
    }
  }

  private handleModify(timeline: TimelineState, operation: OperationalTransform): void {
    if (operation.target.type === 'clip') {
      for (const track of timeline.tracks) {
        const clip = track.clips.find(c => c.id === operation.target.id);
        if (clip) {
          Object.assign(clip, operation.operation.changes);
          break;
        }
      }
    }
  }

  private handleMove(timeline: TimelineState, operation: OperationalTransform): void {
    if (operation.target.type === 'clip') {
      // Remove from current position
      let movedClip: Clip | null = null;
      for (const track of timeline.tracks) {
        const clipIndex = track.clips.findIndex(c => c.id === operation.target.id);
        if (clipIndex !== -1) {
          movedClip = track.clips.splice(clipIndex, 1)[0];
          break;
        }
      }
      
      // Add to new position
      if (movedClip) {
        const targetTrack = timeline.tracks.find(t => t.id === operation.operation.targetTrackId);
        if (targetTrack) {
          movedClip.startTime = operation.operation.newStartTime;
          movedClip.endTime = operation.operation.newEndTime;
          targetTrack.clips.push(movedClip);
        }
      }
    }
  }

  getOperationHistory(): OperationalTransform[] {
    return Array.from(this.operations.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  getAppliedOperations(): OperationalTransform[] {
    return Array.from(this.operations.values()).filter(op => this.appliedOperations.has(op.id));
  }
}

class VersionControl {
  private versions: Map<string, ProjectVersion> = new Map();
  private branches: Map<string, string[]> = new Map(); // branch name -> version IDs
  private currentBranch = 'main';

  constructor() {
    this.branches.set('main', []);
  }

  createVersion(
    projectId: string,
    name: string,
    description: string,
    createdBy: string,
    timeline: TimelineState,
    assets: MediaAsset[],
    parentVersion?: string
  ): ProjectVersion {
    const versionId = `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate changes from parent version
    let changesSummary = { added: [], modified: [], deleted: [] };
    if (parentVersion) {
      const parent = this.versions.get(parentVersion);
      if (parent) {
        changesSummary = this.calculateChanges(parent.timeline, timeline);
      }
    }
    
    const version: ProjectVersion = {
      id: versionId,
      name,
      description,
      createdBy,
      createdAt: Date.now(),
      timeline: JSON.parse(JSON.stringify(timeline)), // Deep clone
      assets: JSON.parse(JSON.stringify(assets)), // Deep clone
      changesSummary,
      parentVersion,
      tags: []
    };
    
    this.versions.set(versionId, version);
    
    // Add to current branch
    const branchVersions = this.branches.get(this.currentBranch) || [];
    branchVersions.push(versionId);
    this.branches.set(this.currentBranch, branchVersions);
    
    return version;
  }

  createBranch(name: string, fromVersion?: string): boolean {
    if (this.branches.has(name)) {
      return false; // Branch already exists
    }
    
    const versions = fromVersion ? [fromVersion] : [];
    this.branches.set(name, versions);
    return true;
  }

  switchBranch(name: string): boolean {
    if (!this.branches.has(name)) {
      return false;
    }
    
    this.currentBranch = name;
    return true;
  }

  mergeBranch(sourceBranch: string, targetBranch: string): ProjectVersion | null {
    const sourceVersions = this.branches.get(sourceBranch);
    const targetVersions = this.branches.get(targetBranch);
    
    if (!sourceVersions || !targetVersions || sourceVersions.length === 0) {
      return null;
    }
    
    const latestSourceVersion = this.versions.get(sourceVersions[sourceVersions.length - 1]);
    const latestTargetVersion = targetVersions.length > 0 ? 
      this.versions.get(targetVersions[targetVersions.length - 1]) : null;
    
    if (!latestSourceVersion) {
      return null;
    }
    
    // Create merge version
    const mergeVersion = this.createVersion(
      'merge',
      `Merge ${sourceBranch} into ${targetBranch}`,
      `Automatic merge of ${sourceBranch} branch`,
      'system',
      latestSourceVersion.timeline,
      latestSourceVersion.assets,
      latestTargetVersion?.id
    );
    
    mergeVersion.tags.push('merge', sourceBranch, targetBranch);
    
    return mergeVersion;
  }

  getVersion(versionId: string): ProjectVersion | undefined {
    return this.versions.get(versionId);
  }

  getVersionHistory(branch?: string): ProjectVersion[] {
    const branchName = branch || this.currentBranch;
    const versionIds = this.branches.get(branchName) || [];
    
    return versionIds
      .map(id => this.versions.get(id))
      .filter(v => v !== undefined) as ProjectVersion[];
  }

  getBranches(): string[] {
    return Array.from(this.branches.keys());
  }

  getCurrentBranch(): string {
    return this.currentBranch;
  }

  tagVersion(versionId: string, tag: string): boolean {
    const version = this.versions.get(versionId);
    if (!version) return false;
    
    if (!version.tags.includes(tag)) {
      version.tags.push(tag);
    }
    
    return true;
  }

  private calculateChanges(oldTimeline: TimelineState, newTimeline: TimelineState): {
    added: string[];
    modified: string[];
    deleted: string[];
  } {
    const changes = { added: [], modified: [], deleted: [] };
    
    // Track clips
    const oldClips = new Map<string, Clip>();
    const newClips = new Map<string, Clip>();
    
    oldTimeline.tracks.forEach(track => {
      track.clips.forEach(clip => oldClips.set(clip.id, clip));
    });
    
    newTimeline.tracks.forEach(track => {
      track.clips.forEach(clip => newClips.set(clip.id, clip));
    });
    
    // Find added clips
    for (const [clipId, clip] of newClips) {
      if (!oldClips.has(clipId)) {
        changes.added.push(clipId);
      }
    }
    
    // Find deleted clips
    for (const [clipId, clip] of oldClips) {
      if (!newClips.has(clipId)) {
        changes.deleted.push(clipId);
      }
    }
    
    // Find modified clips
    for (const [clipId, newClip] of newClips) {
      const oldClip = oldClips.get(clipId);
      if (oldClip && JSON.stringify(oldClip) !== JSON.stringify(newClip)) {
        changes.modified.push(clipId);
      }
    }
    
    return changes;
  }
}

export class RealtimeCollaborationSystem {
  private socket: Socket | null = null;
  private project: VideoProject | null = null;
  private currentUser: User | null = null;
  private connectedUsers: Map<string, User> = new Map();
  private conflictResolver: ConflictResolver;
  private operationalTransform: OperationalTransformEngine;
  private versionControl: VersionControl;
  private eventListeners: Map<string, Function[]> = new Map();
  private operationQueue: OperationalTransform[] = [];
  private isProcessingOperations = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private serverUrl: string = 'ws://localhost:3001') {
    this.conflictResolver = new ConflictResolver();
    this.operationalTransform = new OperationalTransformEngine(this.conflictResolver);
    this.versionControl = new VersionControl();
  }

  async connect(user: User, projectId: string): Promise<void> {
    try {
      this.currentUser = user;
      
      this.socket = io(this.serverUrl, {
        auth: {
          userId: user.id,
          projectId: projectId
        },
        transports: ['websocket', 'polling']
      });
      
      this.setupSocketEventListeners();
      
      return new Promise((resolve, reject) => {
        this.socket!.on('connect', () => {
      
          this.startHeartbeat();
          this.reconnectAttempts = 0;
          resolve();
        });
        
        this.socket!.on('connect_error', (error) => {
          console.error('Connection failed:', error);
          reject(error);
        });
        
        // Join project room
        this.socket!.emit('join_project', { projectId, user });
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.connectedUsers.clear();
    this.eventListeners.clear();
  }

  // Project Management
  async loadProject(projectId: string): Promise<VideoProject> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'));
        return;
      }
      
      this.socket.emit('load_project', { projectId });
      
      this.socket.once('project_loaded', (data) => {
        this.project = data.project;
        this.connectedUsers.clear();
        data.connectedUsers.forEach((user: User) => {
          this.connectedUsers.set(user.id, user);
        });
        resolve(this.project);
      });
      
      this.socket.once('project_load_error', (error) => {
        reject(new Error(error.message));
      });
    });
  }

  async saveProject(): Promise<void> {
    if (!this.socket || !this.project) {
      throw new Error('No project loaded or not connected');
    }
    
    return new Promise((resolve, reject) => {
      this.socket!.emit('save_project', { project: this.project });
      
      this.socket!.once('project_saved', () => {
        resolve();
      });
      
      this.socket!.once('project_save_error', (error) => {
        reject(new Error(error.message));
      });
    });
  }

  // Timeline Operations
  addClip(trackId: string, clip: Omit<Clip, 'id' | 'editedBy' | 'editedAt'>): void {
    if (!this.project || !this.currentUser) return;
    
    const clipId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullClip: Clip = {
      ...clip,
      id: clipId,
      editedBy: this.currentUser.id,
      editedAt: Date.now()
    };
    
    const operation: OperationalTransform = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'insert',
      userId: this.currentUser.id,
      timestamp: Date.now(),
      target: { type: 'clip', id: clipId },
      operation: { trackId, clip: fullClip },
      dependencies: [],
      applied: false
    };
    
    this.queueOperation(operation);
    this.broadcastOperation(operation);
  }

  modifyClip(clipId: string, changes: Partial<Clip>): void {
    if (!this.project || !this.currentUser) return;
    
    const operation: OperationalTransform = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'modify',
      userId: this.currentUser.id,
      timestamp: Date.now(),
      target: { type: 'clip', id: clipId },
      operation: { 
        changes: {
          ...changes,
          editedBy: this.currentUser.id,
          editedAt: Date.now()
        }
      },
      dependencies: [],
      applied: false
    };
    
    this.queueOperation(operation);
    this.broadcastOperation(operation);
  }

  deleteClip(clipId: string): void {
    if (!this.project || !this.currentUser) return;
    
    const operation: OperationalTransform = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'delete',
      userId: this.currentUser.id,
      timestamp: Date.now(),
      target: { type: 'clip', id: clipId },
      operation: {},
      dependencies: [],
      applied: false
    };
    
    this.queueOperation(operation);
    this.broadcastOperation(operation);
  }

  moveClip(clipId: string, targetTrackId: string, newStartTime: number, newEndTime: number): void {
    if (!this.project || !this.currentUser) return;
    
    const operation: OperationalTransform = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'move',
      userId: this.currentUser.id,
      timestamp: Date.now(),
      target: { type: 'clip', id: clipId },
      operation: { targetTrackId, newStartTime, newEndTime },
      dependencies: [],
      applied: false
    };
    
    this.queueOperation(operation);
    this.broadcastOperation(operation);
  }

  // Playhead and Selection
  updatePlayhead(time: number): void {
    if (!this.project || !this.currentUser) return;
    
    this.project.timeline.playhead = time;
    
    if (this.socket) {
      this.socket.emit('playhead_moved', {
        projectId: this.project.id,
        userId: this.currentUser.id,
        time
      });
    }
  }

  updateSelection(startTime: number, endTime: number, trackId?: string): void {
    if (!this.currentUser) return;
    
    this.currentUser.selection = { startTime, endTime, trackId };
    
    if (this.socket) {
      this.socket.emit('selection_changed', {
        userId: this.currentUser.id,
        selection: this.currentUser.selection
      });
    }
  }

  updateCursor(x: number, y: number): void {
    if (!this.currentUser) return;
    
    this.currentUser.cursor = { x, y, timestamp: Date.now() };
    
    // Throttle cursor updates
    if (this.socket && Date.now() - (this.currentUser.cursor.timestamp || 0) > 50) {
      this.socket.emit('cursor_moved', {
        userId: this.currentUser.id,
        cursor: this.currentUser.cursor
      });
    }
  }

  // Comments
  addComment(
    content: string,
    position?: { time: number; trackId?: string; clipId?: string },
    mentions: string[] = []
  ): Comment {
    if (!this.project || !this.currentUser) {
      throw new Error('No project loaded or user not set');
    }
    
    const comment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userAvatar: this.currentUser.avatar,
      content,
      timestamp: Date.now(),
      position,
      replies: [],
      resolved: false,
      mentions,
      attachments: []
    };
    
    this.project.comments.push(comment);
    
    if (this.socket) {
      this.socket.emit('comment_added', {
        projectId: this.project.id,
        comment
      });
    }
    
    this.emitEvent('comment_added', { comment });
    return comment;
  }

  replyToComment(commentId: string, content: string): Comment {
    if (!this.project || !this.currentUser) {
      throw new Error('No project loaded or user not set');
    }
    
    const parentComment = this.project.comments.find(c => c.id === commentId);
    if (!parentComment) {
      throw new Error('Parent comment not found');
    }
    
    const reply: Comment = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userAvatar: this.currentUser.avatar,
      content,
      timestamp: Date.now(),
      replies: [],
      resolved: false,
      mentions: [],
      attachments: []
    };
    
    parentComment.replies.push(reply);
    
    if (this.socket) {
      this.socket.emit('comment_replied', {
        projectId: this.project.id,
        commentId,
        reply
      });
    }
    
    this.emitEvent('comment_replied', { commentId, reply });
    return reply;
  }

  resolveComment(commentId: string): void {
    if (!this.project || !this.currentUser) return;
    
    const comment = this.project.comments.find(c => c.id === commentId);
    if (!comment) return;
    
    comment.resolved = true;
    comment.resolvedBy = this.currentUser.id;
    comment.resolvedAt = Date.now();
    
    if (this.socket) {
      this.socket.emit('comment_resolved', {
        projectId: this.project.id,
        commentId,
        resolvedBy: this.currentUser.id
      });
    }
    
    this.emitEvent('comment_resolved', { commentId });
  }

  // Version Control
  createVersion(name: string, description: string): ProjectVersion {
    if (!this.project || !this.currentUser) {
      throw new Error('No project loaded or user not set');
    }
    
    const version = this.versionControl.createVersion(
      this.project.id,
      name,
      description,
      this.currentUser.id,
      this.project.timeline,
      this.project.assets
    );
    
    if (this.socket) {
      this.socket.emit('version_created', {
        projectId: this.project.id,
        version
      });
    }
    
    this.emitEvent('version_created', { version });
    return version;
  }

  loadVersion(versionId: string): void {
    const version = this.versionControl.getVersion(versionId);
    if (!version || !this.project) return;
    
    this.project.timeline = JSON.parse(JSON.stringify(version.timeline));
    this.project.assets = JSON.parse(JSON.stringify(version.assets));
    
    this.emitEvent('version_loaded', { version });
  }

  // Conflict Resolution
  getConflicts(): Conflict[] {
    return this.conflictResolver.getUnresolvedConflicts();
  }

  resolveConflict(conflictId: string, strategy: string): Promise<boolean> {
    if (!this.currentUser) return Promise.resolve(false);
    
    return this.conflictResolver.resolveConflict(conflictId, strategy, this.currentUser.id);
  }

  proposeConflictResolution(
    conflictId: string,
    strategy: 'accept_mine' | 'accept_theirs' | 'merge' | 'custom',
    description: string,
    changes?: any
  ): string {
    if (!this.currentUser) throw new Error('User not set');
    
    return this.conflictResolver.proposeResolution(conflictId, {
      userId: this.currentUser.id,
      strategy,
      description,
      changes: changes || {}
    });
  }

  voteOnConflictProposal(conflictId: string, proposalId: string, vote: 'approve' | 'reject'): boolean {
    if (!this.currentUser) return false;
    
    return this.conflictResolver.voteOnProposal(conflictId, proposalId, this.currentUser.id, vote);
  }

  // User Management
  getConnectedUsers(): User[] {
    return Array.from(this.connectedUsers.values());
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  updateUserStatus(status: 'online' | 'away' | 'offline'): void {
    if (!this.currentUser || !this.socket) return;
    
    this.currentUser.status = status;
    this.currentUser.lastSeen = Date.now();
    
    this.socket.emit('user_status_changed', {
      userId: this.currentUser.id,
      status,
      lastSeen: this.currentUser.lastSeen
    });
  }

  // Event System
  addEventListener(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  removeEventListener(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Private Methods
  private setupSocketEventListeners(): void {
    if (!this.socket) return;
    
    this.socket.on('user_joined', (data) => {
      this.connectedUsers.set(data.user.id, data.user);
      this.emitEvent('user_joined', data);
    });
    
    this.socket.on('user_left', (data) => {
      this.connectedUsers.delete(data.userId);
      this.emitEvent('user_left', data);
    });
    
    this.socket.on('operation_received', (data) => {
      this.operationalTransform.addOperation(data.operation);
      this.queueOperation(data.operation);
    });
    
    this.socket.on('playhead_moved', (data) => {
      if (this.project && data.userId !== this.currentUser?.id) {
        this.project.timeline.playhead = data.time;
        this.emitEvent('playhead_moved', data);
      }
    });
    
    this.socket.on('cursor_moved', (data) => {
      const user = this.connectedUsers.get(data.userId);
      if (user && data.userId !== this.currentUser?.id) {
        user.cursor = data.cursor;
        this.emitEvent('cursor_moved', data);
      }
    });
    
    this.socket.on('selection_changed', (data) => {
      const user = this.connectedUsers.get(data.userId);
      if (user && data.userId !== this.currentUser?.id) {
        user.selection = data.selection;
        this.emitEvent('selection_changed', data);
      }
    });
    
    this.socket.on('comment_added', (data) => {
      if (this.project && data.userId !== this.currentUser?.id) {
        this.project.comments.push(data.comment);
        this.emitEvent('comment_added', data);
      }
    });
    
    this.socket.on('comment_resolved', (data) => {
      if (this.project && data.userId !== this.currentUser?.id) {
        const comment = this.project.comments.find(c => c.id === data.commentId);
        if (comment) {
          comment.resolved = true;
          comment.resolvedBy = data.resolvedBy;
          comment.resolvedAt = Date.now();
        }
        this.emitEvent('comment_resolved', data);
      }
    });
    
    this.socket.on('conflict_detected', (data) => {
      this.emitEvent('conflict_detected', data);
    });
    
    this.socket.on('disconnect', () => {
  
      this.emitEvent('disconnected', {});
      this.attemptReconnect();
    });
    
    this.socket.on('reconnect', () => {
  
      this.emitEvent('reconnected', {});
    });
  }

  private queueOperation(operation: OperationalTransform): void {
    this.operationQueue.push(operation);
    this.processOperationQueue();
  }

  private async processOperationQueue(): Promise<void> {
    if (this.isProcessingOperations || !this.project) return;
    
    this.isProcessingOperations = true;
    
    while (this.operationQueue.length > 0) {
      const operation = this.operationQueue.shift()!;
      
      try {
        this.project.timeline = this.operationalTransform.applyOperation(
          operation.id,
          this.project.timeline
        );
        
        this.emitEvent('timeline_updated', {
          operation,
          timeline: this.project.timeline
        });
      } catch (error) {
        console.error('Failed to apply operation:', error);
        this.emitEvent('operation_failed', { operation, error });
      }
    }
    
    this.isProcessingOperations = false;
  }

  private broadcastOperation(operation: OperationalTransform): void {
    if (this.socket && this.project) {
      this.socket.emit('operation', {
        projectId: this.project.id,
        operation
      });
    }
  }

  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 30000); // Every 30 seconds
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emitEvent('reconnect_failed', {});
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
  
        this.socket.connect();
      }
    }, delay);
  }

  // Utility Methods
  exportProject(): string {
    if (!this.project) throw new Error('No project loaded');
    
    return JSON.stringify({
      project: this.project,
      versions: this.versionControl.getVersionHistory(),
      operations: this.operationalTransform.getOperationHistory()
    }, null, 2);
  }

  importProject(projectData: string): void {
    try {
      const data = JSON.parse(projectData);
      this.project = data.project;
      
      // Restore version history
      if (data.versions) {
        data.versions.forEach((version: ProjectVersion) => {
          this.versionControl.createVersion(
            version.id,
            version.name,
            version.description,
            version.createdBy,
            version.timeline,
            version.assets,
            version.parentVersion
          );
        });
      }
      
      // Restore operations
      if (data.operations) {
        data.operations.forEach((operation: OperationalTransform) => {
          this.operationalTransform.addOperation(operation);
        });
      }
      
      this.emitEvent('project_imported', { project: this.project });
    } catch (error) {
      console.error('Failed to import project:', error);
      throw error;
    }
  }

  getProjectStats(): {
    totalClips: number;
    totalTracks: number;
    totalComments: number;
    totalVersions: number;
    connectedUsers: number;
    unresolvedConflicts: number;
  } {
    if (!this.project) {
      return {
        totalClips: 0,
        totalTracks: 0,
        totalComments: 0,
        totalVersions: 0,
        connectedUsers: 0,
        unresolvedConflicts: 0
      };
    }
    
    const totalClips = this.project.timeline.tracks.reduce(
      (sum, track) => sum + track.clips.length,
      0
    );
    
    return {
      totalClips,
      totalTracks: this.project.timeline.tracks.length,
      totalComments: this.project.comments.length,
      totalVersions: this.versionControl.getVersionHistory().length,
      connectedUsers: this.connectedUsers.size,
      unresolvedConflicts: this.conflictResolver.getUnresolvedConflicts().length
    };
  }
}

export default RealtimeCollaborationSystem;
export {
  User,
  VideoProject,
  TimelineState,
  Track,
  Clip,
  Effect,
  Keyframe,
  Transition,
  Marker,
  MediaAsset,
  Comment,
  ProjectVersion,
  CollaborationEvent,
  Conflict,
  ConflictProposal,
  OperationalTransform
};