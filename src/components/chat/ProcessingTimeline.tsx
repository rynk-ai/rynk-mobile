
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { 
  FileText, 
  Database, 
  Globe, 
  Sparkles, 
  Check, 
  Loader2 
} from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { ChainOfThought, ChainOfThoughtStep, ChainOfThoughtTrigger, ChainOfThoughtContent, ChainOfThoughtItem } from './ChainOfThought';
import type { StatusPill, StatusMetadata } from '../../lib/types';

// Types (simplified from web)
export interface PDFJob {
  jobId: string;
  fileName: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export interface IndexingJob {
    id: string;
    fileName: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
}

export interface ProcessingStage {
  id: 'files' | 'context' | 'search' | 'generate';
  label: string;
  status: 'pending' | 'active' | 'complete' | 'skipped';
  description?: string;
  metadata?: StatusMetadata & {
    jobs?: IndexingJob[];
    pdfJobs?: PDFJob[];
  };
}

interface SearchSource {
  url: string;
  title: string;
  snippet?: string;
}

interface SearchResults {
  sources: SearchSource[];
}

interface ProcessingTimelineProps {
  statusPills: StatusPill[];
  indexingJobs?: IndexingJob[];
  pdfJobs?: PDFJob[];
  isStreaming: boolean;
  hasContent: boolean;
  searchResults?: SearchResults | null;
  style?: any;
}

// Logic (Replicated from web)
function deriveStages(
  statusPills: StatusPill[],
  indexingJobs: IndexingJob[] = [],
  pdfJobs: PDFJob[] = [],
  isStreaming: boolean,
  hasContent: boolean
): ProcessingStage[] {
  const stages: ProcessingStage[] = [];
  
  const latestStatus = statusPills.length > 0 ? statusPills[statusPills.length - 1] : null;
  const currentStatus = latestStatus?.status;
  
  const hasSearched = statusPills.some(s => 
    s.status === 'searching' || s.status === 'reading_sources'
  );
  
  const hasBuiltContext = statusPills.some(s => s.status === 'building_context');
  const contextPill = statusPills.find(s => s.status === 'building_context');
  
  // 1. Files
  const activeJobs = indexingJobs.filter(j => j.status !== 'completed' && j.status !== 'failed');
  const activePdfJobs = pdfJobs.filter(j => j.status !== 'completed' && j.status !== 'failed');
  const hasFiles = indexingJobs.length > 0 || pdfJobs.length > 0;
  
  if (hasFiles) {
    const allIndexingComplete = indexingJobs.every(j => j.status === 'completed');
    const allPdfComplete = pdfJobs.every(j => j.status === 'completed');
    const allComplete = allIndexingComplete && allPdfComplete;
    const totalFiles = indexingJobs.length + pdfJobs.length;
    const completedFiles = indexingJobs.filter(j => j.status === 'completed').length + 
                          pdfJobs.filter(j => j.status === 'completed').length;
    
    stages.push({
      id: 'files',
      label: allComplete ? 'Files processed' : 'Processing files',
      status: allComplete ? 'complete' : (activeJobs.length > 0 || activePdfJobs.length > 0 ? 'active' : 'pending'),
      description: `${completedFiles}/${totalFiles} files indexed`,
      metadata: {
        jobs: indexingJobs,
        pdfJobs: pdfJobs,
      }
    });
  }
  
  // 2. Context
  if (hasBuiltContext || hasSearched || currentStatus === 'synthesizing' || hasContent) {
    const isContextComplete = hasSearched || currentStatus === 'synthesizing' || hasContent;
    const contextChunks = contextPill?.metadata?.contextChunks;
    
    stages.push({
      id: 'context',
      label: isContextComplete 
        ? `Retrieved ${contextChunks || 'relevant'} context${contextChunks && contextChunks > 1 ? ' chunks' : ' chunk'}` 
        : 'Building context',
      status: isContextComplete
        ? 'complete' 
        : currentStatus === 'building_context' 
          ? 'active' 
          : 'pending',
      description: contextChunks 
        ? `Found ${contextChunks} relevant pieces of information from your knowledge base` 
        : 'Searching through conversation history and knowledge base',
      metadata: contextPill?.metadata
    });
  }
  
  // 3. Search
  const hasDeepResearch = statusPills.some(s => s.status === 'planning' || s.status === 'researching');
  
  if (hasSearched || hasDeepResearch) {
    const searchPill = statusPills.find(s => 
      s.status === 'reading_sources' || 
      s.status === 'searching' ||
      s.status === 'planning' ||
      s.status === 'researching'
    );
    const isSearchComplete = currentStatus === 'synthesizing' || hasContent;
    const sourceCount = searchPill?.metadata?.sourceCount;
    
    let label = hasDeepResearch ? 'Deep Research' : 'Web Search';
    let description = 'Finding relevant sources';
    
    if (isSearchComplete) {
       label = hasDeepResearch 
         ? `Researched ${sourceCount || ''} sources` 
         : `Found ${sourceCount || ''} sources`;
       description = `Gathered information from ${sourceCount || 0} sources`;
    } else {
       if (currentStatus === 'planning') {
         description = 'Formulating research strategy...';
       } else if (currentStatus === 'researching') {
         description = searchPill?.message || 'Conducting deep research...';
       } else if (searchPill?.metadata?.currentSource) {
         description = `Reading: ${searchPill.metadata.currentSource}`;
       }
    }

    stages.push({
      id: 'search',
      label: label,
      status: isSearchComplete 
        ? 'complete' 
        : (currentStatus === 'searching' || currentStatus === 'reading_sources' || currentStatus === 'planning' || currentStatus === 'researching')
          ? 'active'
          : 'pending',
      description: description,
      metadata: searchPill?.metadata
    });
  }
  
  return stages;
}

function StageIcon({ stageId, status }: { stageId: ProcessingStage['id'], status: ProcessingStage['status'] }) {
  const iconSize = 14;
  const color = status === 'active' ? theme.colors.text.primary : theme.colors.text.tertiary;
  
  if (status === 'complete') {
    return <Check size={iconSize} color={theme.colors.accent.primary} />;
  }
  
  if (status === 'active') {
    // Should be animated spinner in real implementation
    return <Loader2 size={iconSize} color={theme.colors.accent.primary} />; // animate manually or use specific prop if available
  }
  
  switch (stageId) {
    case 'files': return <FileText size={iconSize} color={color} />;
    case 'context': return <Database size={iconSize} color={color} />;
    case 'search': return <Globe size={iconSize} color={color} />;
    case 'generate': return <Sparkles size={iconSize} color={color} />;
    default: return <Sparkles size={iconSize} color={color} />;
  }
}

export function ProcessingTimeline({
  statusPills,
  indexingJobs = [],
  pdfJobs = [],
  isStreaming,
  hasContent,
  searchResults,
  style
}: ProcessingTimelineProps) {
  
  const stages = useMemo(
    () => deriveStages(statusPills, indexingJobs, pdfJobs, isStreaming, hasContent),
    [statusPills, indexingJobs, pdfJobs, isStreaming, hasContent]
  );
  
  const visibleStages = useMemo(
    () => stages.filter(s => s.status === 'active' || s.status === 'complete'),
    [stages]
  );
  
  if (visibleStages.length === 0) return null;

  const allComplete = visibleStages.every(s => s.status === 'complete');
  if (allComplete && hasContent && !isStreaming) return null;

  return (
    <View style={[styles.container, style]}>
      <ChainOfThought>
        {visibleStages.map((stage) => (
          <ChainOfThoughtStep 
            key={stage.id}
            defaultOpen={stage.status === 'active'}
          >
            <ChainOfThoughtTrigger 
               leftIcon={<StageIcon stageId={stage.id} status={stage.status} />}
               status={stage.status}
            >
              {stage.label}
            </ChainOfThoughtTrigger>
            
            <ChainOfThoughtContent>
              {stage.description && (
                <ChainOfThoughtItem>
                  {stage.description}
                </ChainOfThoughtItem>
              )}
              
              {/* File details */}
              {stage.id === 'files' && stage.metadata?.jobs && (
                 stage.metadata.jobs.map((job: IndexingJob) => (
                   <ChainOfThoughtItem key={job.id}>
                     • {job.fileName} ({job.progress}%)
                   </ChainOfThoughtItem>
                 ))
              )}

              {/* Search results - simplified for mobile */}
              {stage.id === 'search' && searchResults?.sources && searchResults.sources.length > 0 && (
                 <View style={{ marginTop: 4 }}>
                   {searchResults.sources.slice(0, 3).map((source, idx) => (
                      <ChainOfThoughtItem key={idx}>
                        • {source.title}
                      </ChainOfThoughtItem>
                   ))}
                   {searchResults.sources.length > 3 && (
                     <ChainOfThoughtItem>
                       + {searchResults.sources.length - 3} more sources...
                     </ChainOfThoughtItem>
                   )}
                 </View>
              )}
            </ChainOfThoughtContent>
          </ChainOfThoughtStep>
        ))}
      </ChainOfThought>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  }
});
