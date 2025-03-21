import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica'
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
    marginTop: 15,
    fontWeight: 'bold'
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
    fontWeight: 'bold'
  },
  text: {
    fontSize: 12,
    marginBottom: 6
  },
  listItem: {
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 15
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    paddingBottom: 10
  },
  headerText: {
    fontSize: 10,
    color: 'grey'
  },
  section: {
    marginBottom: 15
  }
});

const AuditPDF = ({ data, parameters, purpose, userType }) => {
  if (!data) return null;
  
  const { summary, incomeAnalysis, expenseAnalysis, budgetAnalysis, investmentAnalysis, findings, recommendations } = data;
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{userType === 'personal' ? 'Personal' : 'Organizational'} Financial Audit</Text>
          <Text style={styles.headerText}>Purpose: {purpose}</Text>
          <Text style={styles.headerText}>Date Range: {parameters.dateRange.startDate} to {parameters.dateRange.endDate}</Text>
          <Text style={styles.headerText}>Generated: {new Date().toLocaleString()}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.subtitle}>Executive Summary</Text>
          <Text style={styles.text}>{summary}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income Analysis</Text>
          <Text style={styles.text}>{incomeAnalysis}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Analysis</Text>
          <Text style={styles.text}>{expenseAnalysis}</Text>
        </View>
        
        {budgetAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Analysis</Text>
            <Text style={styles.text}>{budgetAnalysis}</Text>
          </View>
        )}
        
        {investmentAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Investment Analysis</Text>
            <Text style={styles.text}>{investmentAnalysis}</Text>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.subtitle}>Key Findings</Text>
          {findings.map((finding, i) => (
            <Text key={i} style={styles.listItem}>• {finding}</Text>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.subtitle}>Recommendations</Text>
          {recommendations.map((rec, i) => (
            <Text key={i} style={styles.listItem}>• {rec}</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default AuditPDF;