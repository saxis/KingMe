// app/(tabs)/desires.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useStore, useFreedomScore } from '../../src/store/useStore';
import { researchDesire, calculateDesireImpact } from '../../src/services/claude';
import type { Desire } from '../../src/types';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';

export default function DesiresScreen() {
  const desires = useStore((state) => state.desires);
  const addDesire = useStore((state) => state.addDesire);
  const removeDesire = useStore((state) => state.removeDesire);
  const freedom = useFreedomScore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResearchModal, setShowResearchModal] = useState(false);
  
  // Form state
  const [desireName, setDesireName] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<any>(null);

  const handleStartResearch = async () => {
    if (!desireName.trim()) return;
    
    setIsResearching(true);
    setShowAddModal(false);
    setShowResearchModal(true);
    
    try {
      // Call Claude API to research the desire
      const result = await researchDesire(desireName, freedom);
      setResearchResult(result);
    } catch (error: any) {
      console.error('Research failed:', error);
      setResearchResult({
        error: true,
        message: error.message || 'Failed to research desire. Please try again.',
      });
    } finally {
      setIsResearching(false);
    }
  };

  const handleAddDesireFromResearch = () => {
    if (!researchResult || researchResult.error) return;
    
    const newDesire: Desire = {
      id: Date.now().toString(),
      name: researchResult.productName || desireName,
      estimatedCost: researchResult.recommendedPrice || 0,
      priority: 'medium',
      category: 'other',
      notes: researchResult.summary,
      aiResearch: {
        researchedAt: new Date().toISOString(),
        recommendation: researchResult.recommendation,
        alternatives: researchResult.alternatives || [],
      },
    };
    
    addDesire(newDesire);
    
    // Reset and close
    setShowResearchModal(false);
    setResearchResult(null);
    setDesireName('');
  };

  const handleManualAdd = () => {
    setShowAddModal(false);
    setShowResearchModal(true);
    setResearchResult({
      manual: true,
      productName: desireName,
      recommendedPrice: 0,
    });
  };

  const calculateTotalDesires = () => {
    return desires.reduce((sum, desire) => sum + desire.estimatedCost, 0);
  };

  return (
    <View style={styles.container}>
      <ResponsiveContainer>
      <ScrollView style={styles.scrollView}>
        {/* Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Desired Purchases</Text>
          <Text style={styles.summaryValue}>${calculateTotalDesires().toLocaleString()}</Text>
          <Text style={styles.summarySubtext}>
            {desires.length} {desires.length === 1 ? 'desire' : 'desires'} tracked
          </Text>
        </View>

        {/* AI Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ✨ Let AI help you research and plan your purchases. Get recommendations, see impact on your freedom score, and find the best time to buy.
          </Text>
        </View>

        {/* Desires List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Desires</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {desires.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No desires yet</Text>
              <Text style={styles.emptySubtext}>
                Tell us what you want and let AI help you plan it
              </Text>
            </View>
          ) : (
            desires.map((desire) => (
              <View key={desire.id} style={styles.desireCard}>
                <View style={styles.desireHeader}>
                  <View style={styles.desireHeaderLeft}>
                    <Text style={styles.desireName}>{desire.name}</Text>
                    {desire.aiResearch && (
                      <Text style={styles.aiLabel}>✨ AI Researched</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => removeDesire(desire.id)}>
                    <Text style={styles.deleteButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.desireCost}>
                  ${desire.estimatedCost.toLocaleString()}
                </Text>
                
                {desire.notes && (
                  <Text style={styles.desireNotes} numberOfLines={2}>
                    {desire.notes}
                  </Text>
                )}

                {desire.aiResearch && (
                  <TouchableOpacity style={styles.viewDetailsButton}>
                    <Text style={styles.viewDetailsText}>View AI Recommendation</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
        </ScrollView>
        </ResponsiveContainer>

      {/* Add Desire Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>What do you want?</Text>

            <Text style={styles.label}>Tell me what you're looking for</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., a new dishwasher, gaming laptop, vacation"
              placeholderTextColor="#666"
              value={desireName}
              onChangeText={setDesireName}
              multiline
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setDesireName('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalAddButton, !desireName.trim() && styles.modalAddButtonDisabled]}
                onPress={handleStartResearch}
                disabled={!desireName.trim()}
              >
                <Text style={styles.modalAddText}>✨ Research with AI</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.manualButton}
              onPress={handleManualAdd}
              disabled={!desireName.trim()}
            >
              <Text style={styles.manualButtonText}>Skip AI, add manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Research Results Modal */}
      <Modal
        visible={showResearchModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowResearchModal(false)}
      >
        <View style={styles.researchContainer}>
          <ScrollView style={styles.researchScrollView}>
            {isResearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f4c430" />
                <Text style={styles.loadingText}>AI is researching...</Text>
                <Text style={styles.loadingSubtext}>
                  Searching products, comparing prices, calculating impact
                </Text>
              </View>
            ) : researchResult?.error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Research Failed</Text>
                <Text style={styles.errorText}>{researchResult.message}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleStartResearch}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : researchResult?.manual ? (
              <View style={styles.manualContainer}>
                <Text style={styles.researchTitle}>Add Manually</Text>
                <Text style={styles.label}>Estimated Cost</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    onChangeText={(text) => {
                      setResearchResult({
                        ...researchResult,
                        recommendedPrice: parseFloat(text) || 0,
                      });
                    }}
                  />
                </View>
              </View>
            ) : researchResult ? (
              <View style={styles.resultsContainer}>
                <Text style={styles.researchTitle}>AI Recommendation</Text>
                
                {/* Product Info */}
                <View style={styles.productBox}>
                  <Text style={styles.productName}>{researchResult.productName}</Text>
                  <Text style={styles.productPrice}>
                    ${researchResult.recommendedPrice?.toLocaleString()}
                  </Text>
                  <Text style={styles.productDescription}>
                    {researchResult.summary}
                  </Text>
                </View>

                {/* Impact Analysis */}
                <View style={styles.impactBox}>
                  <Text style={styles.impactTitle}>Impact on Freedom Score</Text>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Current:</Text>
                    <Text style={styles.impactCurrent}>{freedom.formatted}</Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>After purchase:</Text>
                    <Text style={styles.impactAfter}>
                      {researchResult.impactDays} days
                    </Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Change:</Text>
                    <Text style={[
                      styles.impactChange,
                      researchResult.impactChange < 0 && styles.impactChangeNegative
                    ]}>
                      {researchResult.impactChange > 0 ? '+' : ''}
                      {researchResult.impactChange} days
                    </Text>
                  </View>
                </View>

                {/* Recommendation */}
                <View style={styles.recommendationBox}>
                  <Text style={styles.recommendationTitle}>💡 Recommendation</Text>
                  <Text style={styles.recommendationText}>
                    {researchResult.recommendation}
                  </Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {!isResearching && !researchResult?.error && (
            <View style={styles.researchButtonContainer}>
              <TouchableOpacity
                style={styles.researchCancelButton}
                onPress={() => {
                  setShowResearchModal(false);
                  setResearchResult(null);
                  setDesireName('');
                }}
              >
                <Text style={styles.researchCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.researchAddButton}
                onPress={handleAddDesireFromResearch}
              >
                <Text style={styles.researchAddText}>Add to Desires</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  summaryBox: {
    backgroundColor: '#1a1f2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#9b59b6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9b59b6',
  },
  summarySubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#1a1f2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f4c430',
  },
  infoText: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
  },
  desireCard: {
    backgroundColor: '#1a1f2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
  },
  desireHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  desireHeaderLeft: {
    flex: 1,
  },
  desireName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  aiLabel: {
    fontSize: 12,
    color: '#f4c430',
    fontWeight: '600',
  },
  deleteButton: {
    fontSize: 20,
    color: '#ff4444',
    padding: 4,
  },
  desireCost: {
    fontSize: 20,
    color: '#9b59b6',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  desireNotes: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
    marginBottom: 8,
  },
  viewDetailsButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#f4c430',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a0e1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f4c430',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 2,
    borderColor: '#2a2f3e',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2a2f3e',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#a0a0a0',
    fontSize: 16,
  },
  modalAddButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f4c430',
    alignItems: 'center',
  },
  modalAddButtonDisabled: {
    opacity: 0.5,
  },
  modalAddText: {
    color: '#0a0e1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  manualButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  manualButtonText: {
    color: '#666',
    fontSize: 14,
  },
  // Research modal styles
  researchContainer: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  researchScrollView: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#f4c430',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#0a0e1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  manualContainer: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#2a2f3e',
  },
  currencySymbol: {
    fontSize: 20,
    color: '#9b59b6',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: '#ffffff',
    paddingVertical: 16,
  },
  resultsContainer: {
    paddingBottom: 100,
  },
  researchTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f4c430',
    marginBottom: 20,
  },
  productBox: {
    backgroundColor: '#1a1f2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#9b59b6',
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#9b59b6',
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
  },
  impactBox: {
    backgroundColor: '#1a1f2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  impactLabel: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  impactCurrent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ade80',
  },
  impactAfter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  impactChange: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ade80',
  },
  impactChangeNegative: {
    color: '#ff6b6b',
  },
  recommendationBox: {
    backgroundColor: '#1a1f2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f4c430',
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f4c430',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  researchButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#0a0e1a',
    borderTopWidth: 1,
    borderTopColor: '#1a1f2e',
  },
  researchCancelButton: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2a2f3e',
    alignItems: 'center',
  },
  researchCancelText: {
    color: '#a0a0a0',
    fontSize: 16,
  },
  researchAddButton: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#9b59b6',
    alignItems: 'center',
  },
  researchAddText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
