// src/styles/support.style.js

import { StyleSheet } from 'react-native';

export const supportStyles = StyleSheet.create({
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
    gap: 10,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 13,
    borderWidth: 1,
    padding: 14,
  },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  contactValue: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  faqList: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQ: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  faqA: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
  emptyFaq: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFaqText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  legalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  legalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 13,
    borderWidth: 1,
    padding: 14,
  },
  legalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  versionRow: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  versionSub: {
    fontSize: 11,
  },
});