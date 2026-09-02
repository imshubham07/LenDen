import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type WelcomeScreenProps = {
  onDone: () => void;
};

const slides = [
  {
    title: 'Manage lending with clarity',
    body: 'Track borrowers, loans, repayments, and pending balances in one simple place.',
  },
  {
    title: 'Stay ahead of every payment',
    body: 'See what is returned, what is due, and keep your money records organized.',
  },
];
const DOTS_TOP = Array.from({ length: 12 }, (_, index) => index);
const DOTS_BOTTOM = Array.from({ length: 9 }, (_, index) => index);
const RINGS_TOP = [0, 20, 40, 60, 80];
const RINGS_BOTTOM = [0, 18, 36, 54];
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export function WelcomeScreen({ onDone }: WelcomeScreenProps) {
  const [page, setPage] = useState(0);
  const intro = useSharedValue(0);
  const float = useSharedValue(0);
  const orbit = useSharedValue(0);
  const waveOne = useSharedValue(0);
  const waveTwo = useSharedValue(0);
  const pageMotion = useSharedValue(1);

  const isLastPage = page === slides.length - 1;

  useEffect(() => {
    intro.value = withTiming(1, {
      duration: 850,
      easing: Easing.out(Easing.cubic),
    });
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    orbit.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.linear }), -1, false);
    waveOne.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    waveTwo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [float, intro, orbit, waveOne, waveTwo]);

  useEffect(() => {
    pageMotion.value = 0;
    pageMotion.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [page, pageMotion]);

  const backgroundStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [0, -8]) },
      { scale: interpolate(float.value, [0, 1], [1, 1.018]) },
    ],
  }));

  const blobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(float.value, [0, 0.5, 1], [0, 12, 4]) },
      { translateY: interpolate(float.value, [0, 0.5, 1], [0, 6, 15]) },
      { rotate: `${interpolate(orbit.value, [0, 1], [-4, 8])}deg` },
    ],
  }));

  const ringTopStyle = useAnimatedStyle(() => ({
    opacity: interpolate(float.value, [0, 1], [0.45, 0.9]),
    transform: [
      { rotate: `${interpolate(orbit.value, [0, 1], [0, 360])}deg` },
      { scale: interpolate(float.value, [0, 1], [1, 1.045]) },
    ],
  }));

  const ringBottomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(float.value, [0, 1], [0.32, 0.72]),
    transform: [
      { rotate: `${interpolate(orbit.value, [0, 1], [360, 0])}deg` },
      { scale: interpolate(float.value, [0, 1], [1.03, 0.98]) },
    ],
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(float.value, [0, 1], [0.42, 0.85]),
    transform: [
      { translateY: interpolate(float.value, [0, 1], [0, -4]) },
      { translateX: interpolate(orbit.value, [0, 1], [0, 10]) },
    ],
  }));

  const waveOneStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(waveOne.value, [0, 1], [0, -18]) }, { rotate: '-8deg' }],
  }));

  const waveTwoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(waveTwo.value, [0, 1], [0, 18]) }, { rotate: '-4deg' }],
  }));

  const heroStyle = useAnimatedStyle(() => ({
    opacity: intro.value,
    transform: [
      { translateY: interpolate(intro.value, [0, 1], [-22, 0]) },
      { scale: interpolate(intro.value, [0, 1], [0.9, 1]) },
      { translateY: interpolate(float.value, [0, 1], [0, -8]) },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: pageMotion.value,
    transform: [{ translateY: interpolate(pageMotion.value, [0, 1], [18, 0]) }],
  }));

  function handleNext() {
    if (isLastPage) {
      onDone();
      return;
    }

    setPage((current) => current + 1);
  }

  return (
    <View style={styles.screen}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, backgroundStyle]}>
        <View style={styles.bgBase} />
        <Animated.View style={[styles.welcomeSpotlight, blobStyle]} />
        <View style={styles.topArc} />
        <View style={styles.sideOrb} />

        <Animated.View style={[styles.dotGrid, styles.dotGridTop, dotsStyle]}>
          {DOTS_TOP.map((dot) => (
            <View key={dot} style={styles.bgDot} />
          ))}
        </Animated.View>
        <Animated.View style={[styles.dotGrid, styles.dotGridBottom, dotsStyle]}>
          {DOTS_BOTTOM.map((dot) => (
            <View key={dot} style={styles.bgDot} />
          ))}
        </Animated.View>

        <Animated.View style={[styles.ringWrapTop, ringTopStyle]}>
          {RINGS_TOP.map((inset) => (
            <View key={inset} style={[styles.ring, { inset }]} />
          ))}
        </Animated.View>
        <Animated.View style={[styles.ringWrapBottom, ringBottomStyle]}>
          {RINGS_BOTTOM.map((inset) => (
            <View key={inset} style={[styles.ring, { inset }]} />
          ))}
        </Animated.View>

        <Animated.View style={[styles.coinOrbit, ringTopStyle]}>
          <View style={[styles.coin, styles.coinOne]}>
            <Text style={styles.coinText}>₹</Text>
          </View>
          <View style={[styles.coin, styles.coinTwo]}>
            <Text style={styles.coinText}>+</Text>
          </View>
          <View style={[styles.miniCard, styles.cardOne]} />
          <View style={[styles.miniCard, styles.cardTwo]} />
        </Animated.View>

        <View style={styles.waves}>
          <AnimatedSvg
            width="200%"
            height="100%"
            viewBox="0 0 800 340"
            preserveAspectRatio="none"
            style={[styles.waveSvg, waveOneStyle]}>
            <Defs>
              <LinearGradient id="welcomeWaveOne" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#0B75D1" />
                <Stop offset="52%" stopColor="#19C6B6" />
                <Stop offset="100%" stopColor="#7BEA42" />
              </LinearGradient>
            </Defs>
            <Path
              fill="url(#welcomeWaveOne)"
              d="M0,150 C90,80 190,62 305,122 C425,185 520,160 625,82 C705,22 760,34 800,58 L800,340 L0,340 Z"
            />
          </AnimatedSvg>
          <AnimatedSvg
            width="200%"
            height="100%"
            viewBox="0 0 800 340"
            preserveAspectRatio="none"
            style={[styles.waveSvg, styles.waveSvgTwo, waveTwoStyle]}>
            <Defs>
              <LinearGradient id="welcomeWaveTwo" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#092E87" />
                <Stop offset="58%" stopColor="#0D7B7B" />
                <Stop offset="100%" stopColor="#29B950" />
              </LinearGradient>
            </Defs>
            <Path
              fill="url(#welcomeWaveTwo)"
              opacity={0.62}
              d="M0,205 C110,145 220,128 350,170 C485,214 590,214 700,138 C748,105 782,100 800,112 L800,340 L0,340 Z"
            />
          </AnimatedSvg>
        </View>
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Pressable hitSlop={10} onPress={onDone} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>

          <Animated.View style={[styles.hero, heroStyle]}>
            <Image
              source={require('../assets/images/logWithoutBG.png')}
              resizeMode="contain"
              style={styles.logo}
            />
          </Animated.View>

          <Animated.View style={[styles.copyWrap, contentStyle]}>
            <Text style={styles.stepText}>0{page + 1} / 02</Text>
            <Text style={styles.title}>{slides[page].title}</Text>
            <Text style={styles.body}>{slides[page].body}</Text>
          </Animated.View>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {slides.map((slide, index) => (
                <View
                  key={slide.title}
                  style={[styles.dot, index === page ? styles.activeDot : null]}
                />
              ))}
            </View>

            <Pressable onPress={handleNext} style={styles.nextButton}>
              <Text style={styles.nextText}>{isLastPage ? 'Get Started' : 'Next'}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#001234',
  },
  bgBase: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#04152D',
    experimental_backgroundImage: 'linear-gradient(160deg, #061B35 0%, #04112A 52%, #020817 100%)',
  },
  welcomeSpotlight: {
    position: 'absolute',
    top: 88,
    left: 34,
    width: 310,
    height: 310,
    borderRadius: 155,
    opacity: 0.58,
    backgroundColor: 'rgba(21, 205, 182, 0.34)',
  },
  topArc: {
    position: 'absolute',
    top: -150,
    right: -140,
    width: 330,
    height: 330,
    borderRadius: 165,
    borderWidth: 34,
    borderColor: 'rgba(126, 235, 71, 0.12)',
  },
  sideOrb: {
    position: 'absolute',
    left: -145,
    bottom: 265,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(19, 116, 210, 0.24)',
  },
  dotGrid: {
    position: 'absolute',
    width: 70,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  dotGridTop: {
    top: 92,
    right: 28,
    left: undefined,
  },
  dotGridBottom: {
    left: 28,
    right: undefined,
    bottom: 212,
    width: 52,
  },
  bgDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2B5FD9',
    opacity: 0.55,
  },
  ringWrapTop: {
    position: 'absolute',
    top: 178,
    left: -86,
    width: 230,
    height: 230,
  },
  ringWrapBottom: {
    position: 'absolute',
    right: -82,
    bottom: 222,
    width: 190,
    height: 190,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.35)',
  },
  coinOrbit: {
    position: 'absolute',
    top: 178,
    alignSelf: 'center',
    width: 250,
    height: 250,
  },
  coin: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7BEA42',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  coinOne: {
    top: 0,
    right: 30,
  },
  coinTwo: {
    left: 8,
    bottom: 42,
    backgroundColor: '#19C6B6',
  },
  coinText: {
    color: '#061B35',
    fontSize: 21,
    fontWeight: '900',
  },
  miniCard: {
    position: 'absolute',
    width: 72,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardOne: {
    top: 42,
    left: 10,
    transform: [{ rotate: '-14deg' }],
  },
  cardTwo: {
    right: 0,
    bottom: 14,
    transform: [{ rotate: '12deg' }],
  },
  waves: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -58,
    height: 300,
    overflow: 'hidden',
  },
  waveSvg: {
    position: 'absolute',
    bottom: 0,
    left: '-50%',
  },
  waveSvgTwo: {
    opacity: 0.9,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 18,
    paddingBottom: 34,
  },
  skipButton: {
    alignSelf: 'flex-end',
    minHeight: 36,
    justifyContent: 'center',
  },
  skipText: {
    color: '#A8B4CC',
    fontSize: 14,
    fontWeight: '700',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 260,
    height: 220,
  },
  copyWrap: {
    minHeight: 178,
  },
  stepText: {
    color: '#78EC34',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 38,
    marginTop: 14,
    textAlign: 'center',
  },
  body: {
    color: '#B9C4D7',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    marginTop: 14,
    textAlign: 'center',
  },
  footer: {
    marginTop: 26,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 22,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#294369',
  },
  activeDot: {
    width: 28,
    backgroundColor: '#78EC34',
  },
  nextButton: {
    minHeight: 58,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1EA0FF',
    experimental_backgroundImage: 'linear-gradient(100deg, #80EA4E 0%, #2BC7D6 52%, #1F91FF 100%)',
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
