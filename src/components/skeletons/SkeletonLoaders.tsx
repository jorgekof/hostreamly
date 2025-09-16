import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Skeleton para VideoLibrary
export const VideoLibrarySkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-10 w-64" /> {/* Search bar */}
            <Skeleton className="h-10 w-32" /> {/* Sort dropdown */}
            <Skeleton className="h-10 w-32" /> {/* Filter dropdown */}
          </div>
        </CardContent>
      </Card>

      {/* Grid de videos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" /> {/* Video thumbnail */}
            <CardContent className="p-4">
              <Skeleton className="h-5 w-full mb-2" /> {/* Title */}
              <Skeleton className="h-4 w-3/4 mb-3" /> {/* Description */}
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-16" /> {/* Duration */}
                <Skeleton className="h-4 w-20" /> {/* Views */}
              </div>
              <div className="flex gap-2 mt-3">
                <Skeleton className="h-8 w-8" /> {/* Action button */}
                <Skeleton className="h-8 w-8" /> {/* Action button */}
                <Skeleton className="h-8 w-8" /> {/* Action button */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Skeleton para Dashboard
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" /> {/* Label */}
                  <Skeleton className="h-8 w-16" /> {/* Value */}
                </div>
                <Skeleton className="h-8 w-8" /> {/* Icon */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" /> {/* Chart title */}
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" /> {/* Chart */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" /> {/* Chart title */}
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" /> {/* Chart */}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" /> {/* Section title */}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" /> {/* Avatar */}
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" /> {/* Activity text */}
                  <Skeleton className="h-3 w-1/2" /> {/* Timestamp */}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Skeleton para VideoUpload
export const VideoUploadSkeleton: React.FC = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <Skeleton className="h-6 w-48" /> {/* Title */}
        <Skeleton className="h-4 w-64" /> {/* Description */}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
          <div className="text-center space-y-4">
            <Skeleton className="h-16 w-16 mx-auto" /> {/* Upload icon */}
            <Skeleton className="h-5 w-64 mx-auto" /> {/* Upload text */}
            <Skeleton className="h-10 w-32 mx-auto" /> {/* Browse button */}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-16 mb-2" /> {/* Label */}
            <Skeleton className="h-10 w-full" /> {/* Input */}
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" /> {/* Label */}
            <Skeleton className="h-24 w-full" /> {/* Textarea */}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Select */}
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-2" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Skeleton className="h-10 w-20" /> {/* Cancel button */}
          <Skeleton className="h-10 w-24" /> {/* Upload button */}
        </div>
      </CardContent>
    </Card>
  );
};

// Skeleton para PerformanceMetrics
export const PerformanceMetricsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-32" /> {/* Metric name */}
                <Skeleton className="h-6 w-6" /> {/* Icon */}
              </div>
              <Skeleton className="h-8 w-20 mb-2" /> {/* Value */}
              <Skeleton className="h-4 w-24" /> {/* Unit/description */}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-48" /> {/* Chart title */}
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" /> {/* Time filter */}
              <Skeleton className="h-8 w-24" /> {/* Metric filter */}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" /> {/* Chart */}
        </CardContent>
      </Card>

      {/* Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" /> {/* Section title */}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" /> {/* Metric name */}
                  <Skeleton className="h-4 w-16" /> {/* Value */}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" /> {/* Section title */}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-28" /> {/* Metric name */}
                  <Skeleton className="h-4 w-12" /> {/* Value */}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Skeleton para VideoPlayer
export const VideoPlayerSkeleton: React.FC = () => {
  return (
    <Card className="w-full">
      <CardContent className="p-0">
        {/* Video Area */}
        <div className="relative aspect-video bg-black rounded-t-lg">
          <Skeleton className="h-full w-full rounded-t-lg" />
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="h-16 w-16 rounded-full" />
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4">
          {/* Progress Bar */}
          <Skeleton className="h-2 w-full" />
          
          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" /> {/* Play/Pause */}
              <Skeleton className="h-8 w-8" /> {/* Volume */}
              <Skeleton className="h-4 w-16" /> {/* Time */}
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" /> {/* Settings */}
              <Skeleton className="h-8 w-8" /> {/* Fullscreen */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Skeleton para lista de elementos genérica
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" /> {/* Avatar/Icon */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" /> {/* Title */}
            <Skeleton className="h-3 w-1/2" /> {/* Subtitle */}
          </div>
          <Skeleton className="h-8 w-20" /> {/* Action button */}
        </div>
      ))}
    </div>
  );
};

// Skeleton para tabla
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
      
      {/* Table Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={rowIndex} 
            className="grid gap-4 p-3 border rounded-lg" 
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton para formulario
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" /> {/* Form title */}
        <Skeleton className="h-4 w-64" /> {/* Form description */}
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" /> {/* Label */}
            <Skeleton className="h-10 w-full" /> {/* Input */}
          </div>
        ))}
        
        {/* Form Actions */}
        <div className="flex gap-4 justify-end pt-4">
          <Skeleton className="h-10 w-20" /> {/* Cancel button */}
          <Skeleton className="h-10 w-24" /> {/* Submit button */}
        </div>
      </CardContent>
    </Card>
  );
};
