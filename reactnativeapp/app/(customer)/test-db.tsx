/**
 * Test DB Screen - Add products to DynamoDB
 */

import { MetroButton, MetroCard } from '@/components/metro';
import { FontSizes, Fonts, MetroColors, Spacing } from '@/constants/theme';
import { getDataClient, isBackendConfigured } from '@/lib/amplify';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TestDBScreen() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');

  const client = getDataClient();

  const loadProducts = async () => {
    if (!isBackendConfigured()) {
      Alert.alert('Error', 'Backend not configured');
      return;
    }

    try {
      const result = await client.models.Product.list();
      setProducts(result.data || []);
    } catch (error: any) {
      console.error('Load products error:', error);
      Alert.alert('Error', error.message || 'Failed to load products');
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addTestProduct = async () => {
    if (!productName.trim()) {
      Alert.alert('Error', 'Enter product name');
      return;
    }

    setLoading(true);
    try {
      const result = await client.models.Product.create({
        name: productName,
        category: 'pantry',
        description: 'Test product',
        unit: 'lb',
        retailPrice: parseFloat(price) || 5.99,
        bulkPrice: parseFloat(price) * 0.8 || 4.99,
        bulkMinimum: 10,
        storeJson: JSON.stringify({
          id: 'test-store',
          name: 'Test Store',
          type: 'retail',
          location: { latitude: 40.7589, longitude: -73.9851 },
        }),
        available: true,
      });

      Alert.alert('Success!', `Added: ${productName}\nID: ${result.data?.id}`);
      setProductName('');
      setPrice('');
      loadProducts();
    } catch (error: any) {
      console.error('Add product error:', error);
      Alert.alert('Error', error.errors?.[0]?.message || error.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  if (!isBackendConfigured()) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Backend not configured</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>TEST</Text>
        <Text style={styles.headerTitle}>DYNAMODB</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Add Product */}
        <MetroCard style={styles.card}>
          <Text style={styles.sectionTitle}>ADD PRODUCT TO DYNAMODB</Text>

          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Organic Milk"
            value={productName}
            onChangeText={setProductName}
            placeholderTextColor={MetroColors.text.muted}
          />

          <Text style={styles.label}>Retail Price ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="5.99"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholderTextColor={MetroColors.text.muted}
          />

          <MetroButton
            title={loading ? 'ADDING...' : 'ADD TO DYNAMODB'}
            onPress={addTestProduct}
            disabled={loading}
            size="lg"
            fullWidth
          />
        </MetroCard>

        {/* Products List */}
        <MetroCard style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>PRODUCTS IN DYNAMODB ({products.length})</Text>
            <MetroButton title="REFRESH" onPress={loadProducts} size="sm" />
          </View>

          {loading && <ActivityIndicator color={MetroColors.primary} />}

          {products.length === 0 && !loading && (
            <Text style={styles.emptyText}>No products yet. Add one above!</Text>
          )}

          {products.map((product) => (
            <View key={product.id} style={styles.productItem}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>${product.retailPrice}</Text>
              <Text style={styles.productId}>ID: {product.id}</Text>
            </View>
          ))}
        </MetroCard>

        {/* Instructions */}
        <MetroCard style={styles.card}>
          <Text style={styles.sectionTitle}>OK HOW TO VERIFY</Text>
          <Text style={styles.instructionText}>
            1. Add a product above{'\n'}
            2. Go to AWS Console -> DynamoDB{'\n'}
            3. Click "Product-..." table{'\n'}
            4. Click "Explore table items"{'\n'}
            5. See your product in the table!
          </Text>
        </MetroCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetroColors.background.primary,
  },
  header: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
  },
  headerLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 2,
  },
  headerTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing[4],
  },
  card: {
    marginBottom: Spacing[4],
  },
  sectionTitle: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 2,
    marginBottom: Spacing[3],
  },
  label: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    marginBottom: Spacing[2],
    marginTop: Spacing[2],
  },
  input: {
    backgroundColor: MetroColors.background.secondary,
    borderWidth: 1,
    borderColor: MetroColors.border.default,
    borderRadius: 4,
    padding: Spacing[3],
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    color: MetroColors.text.primary,
    marginBottom: Spacing[3],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  emptyText: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    paddingVertical: Spacing[4],
  },
  productItem: {
    backgroundColor: MetroColors.background.secondary,
    padding: Spacing[3],
    borderRadius: 4,
    marginBottom: Spacing[2],
    borderLeftWidth: 3,
    borderLeftColor: MetroColors.accent.cyan,
  },
  productName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing[1],
  },
  productPrice: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    marginBottom: Spacing[1],
  },
  productId: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  instructionText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    lineHeight: 22,
  },
  errorText: {
    color: MetroColors.accent.red,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    textAlign: 'center',
    padding: Spacing[4],
  },
});
