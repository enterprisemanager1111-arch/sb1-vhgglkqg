import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

interface SupabaseStatusProps {
  showDetails?: boolean;
}

export default function SupabaseStatus({ showDetails = false }: SupabaseStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Test Supabase connection
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setIsConnected(false);
        setError(error.message);
      } else {
        setIsConnected(true);
        setError(null);
      }
    } catch (err: any) {
      setIsConnected(false);
      setError(err.message || 'Verbindungsfehler');
    }
  };

  if (!showDetails && isConnected) {
    return null; // Don't show anything if connected and details not requested
  }

  const getStatusColor = () => {
    if (isConnected === null) return '#FFA500'; // Orange for loading
    return isConnected ? '#00FF00' : '#FF0000'; // Green for connected, red for error
  };

  const getStatusText = () => {
    if (isConnected === null) return 'Verbindung wird geprüft...';
    return isConnected ? 'Supabase verbunden' : 'Supabase Verbindungsfehler';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: getStatusColor() }]} />
      <Text style={styles.statusText}>{getStatusText()}</Text>
      {error && showDetails && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#333333',
  },
  errorText: {
    fontSize: 10,
    color: '#FF0000',
    marginTop: 2,
  },
});