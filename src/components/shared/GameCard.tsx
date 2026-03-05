import React from 'react';
import {StyleSheet, View, Text, Image, ImageSourcePropType} from 'react-native';
import {AnimatedPressable} from './AnimatedPressable';

interface GameCardProps {
  icon: string;
  image?: ImageSourcePropType;
  title: string;
  description: string;
  disabled?: boolean;
  disabledLabel?: string;
  onPress: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  icon,
  image,
  title,
  description,
  disabled,
  disabledLabel,
  onPress,
}) => (
  <AnimatedPressable
    style={[styles.card, disabled && styles.cardDisabled]}
    onPress={onPress}
    activeScale={0.96}
    disabled={disabled}>
    <View style={styles.iconWrap}>
      {image ? (
        <Image source={image} style={styles.iconImage} />
      ) : (
        <Text style={styles.iconEmoji}>{icon}</Text>
      )}
    </View>
    <View style={styles.textContainer}>
      <Text style={[styles.title, disabled && styles.titleDisabled]}>{title}</Text>
      <Text style={[styles.desc, disabled && styles.descDisabled]}>
        {disabled && disabledLabel ? disabledLabel : description}
      </Text>
    </View>
    <Text style={styles.chevron}>{disabled ? '' : '>'}</Text>
  </AnimatedPressable>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#34656D',
    borderWidth: 1,
    borderColor: '#3D7A74',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(250,248,241,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconEmoji: {
    fontSize: 26,
  },
  iconImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FAF8F1',
  },
  titleDisabled: {
    color: '#8AABA5',
  },
  desc: {
    fontSize: 13,
    color: '#8AABA5',
    marginTop: 3,
  },
  descDisabled: {
    color: '#6B9C93',
  },
  chevron: {
    fontSize: 24,
    color: '#6B9C93',
    fontWeight: '300',
    marginLeft: 8,
  },
});
