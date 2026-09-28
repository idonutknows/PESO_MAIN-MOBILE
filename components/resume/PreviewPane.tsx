import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ResumeDocument, { RESUME_PAGE_HEIGHT, RESUME_PAGE_WIDTH } from '@/components/resume/ResumeDocument';
import type { ResumeContent, ResumeDesign } from '@/types/resume';

export interface PreviewPaneProps {
  content: ResumeContent;
  design: ResumeDesign;
  /** Fill the available width instead of rendering at 100%. */
  fill?: boolean;
  padded?: boolean;
}

type Zoom = 'fit' | 'actual';

/**
 * Renders the real A4 document and scales it to fit. Because the page geometry
 * (794 × 1123) is identical to the HTML used for the PDF, what is shown here is
 * what gets exported.
 */
export default function PreviewPane({ content, design, fill = true, padded = true }: PreviewPaneProps) {
  const [paneWidth, setPaneWidth] = useState(0);
  const [docHeight, setDocHeight] = useState(RESUME_PAGE_HEIGHT);
  const [zoom, setZoom] = useState<Zoom>('fit');

  const available = Math.max(120, paneWidth - (padded ? 32 : 0));
  const scale = zoom === 'fit' ? available / RESUME_PAGE_WIDTH : 1;
  const onLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    setPaneWidth(e.nativeEvent.layout.width);
  }, []);
  const onDocLayout = useCallback((e: { nativeEvent: { layout: { height: number } } }) => {
    setDocHeight(Math.max(RESUME_PAGE_HEIGHT, e.nativeEvent.layout.height));
  }, []);

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarLabel}>
          A4 · {Math.round(scale * 100)}%
        </Text>
        <View style={styles.zoomGroup}>
          <TouchableOpacity
            onPress={() => setZoom('fit')}
            style={[styles.zoomBtn, zoom === 'fit' ? styles.zoomBtnActive : null]}
          >
            <Text style={[styles.zoomText, zoom === 'fit' ? styles.zoomTextActive : null]}>Fit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setZoom('actual')}
            style={[styles.zoomBtn, zoom === 'actual' ? styles.zoomBtnActive : null]}
          >
            <Text style={[styles.zoomText, zoom === 'actual' ? styles.zoomTextActive : null]}>100%</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, padded ? styles.scrollContentPadded : null]}
        showsVerticalScrollIndicator
        bounces={false}
      >
        {/*
          The transform does not affect layout, so the page is wrapped in a box
          sized to the *scaled* dimensions. Without this the scroll view would
          reserve the full 794pt width and the full page height in Fit mode.
        */}
        <View style={{ width: RESUME_PAGE_WIDTH * scale, height: docHeight * scale }}>
          <View style={[styles.page, { width: RESUME_PAGE_WIDTH, height: docHeight }, styles.pageScaled, { transform: [{ scale }] }]}>
            <View style={styles.doc} onLayout={onDocLayout}>
              <ResumeDocument content={content} design={design} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#E4E6EB',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  toolbarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  zoomGroup: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 2,
  },
  zoomBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  zoomBtnActive: {
    backgroundColor: '#0A7EA4',
  },
  zoomText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  zoomTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  scrollContentPadded: {
    paddingHorizontal: 16,
  },
  page: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  pageScaled: {
    transformOrigin: 'top left',
  },  doc: {
    width: RESUME_PAGE_WIDTH,
  },
});
