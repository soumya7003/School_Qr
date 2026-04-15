import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
    paddingTop: 16,
  },
  contextBanner: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 13,
    borderWidth: 1,
    padding: 14,
    alignItems: 'flex-start',
  },
  contextText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  optionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  selectedDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTagline: {
    fontSize: 12,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  fieldBreakdown: {
    padding: 12,
    gap: 8,
    borderRadius: 12,
  },
  fieldBreakdownTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.0,
    marginBottom: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  fieldLabel: {
    fontSize: 13,
    flex: 1,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  hiddenWarning: {
    borderRadius: 13,
    borderWidth: 1,
    padding: 14,
  },
  hiddenWarningText: {
    fontSize: 13,
    lineHeight: 18,
  },
});