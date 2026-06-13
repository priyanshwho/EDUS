import { motion } from 'framer-motion';

/**
 * PageTransition wraps individual page content with Framer Motion animations.
 * - Fade + blur + subtle vertical slide.
 * - Respects prefers-reduced-motion via CSS media query fallback.
 * - Only the page content area is animated; layout elements (Header, BottomBar, Footer) are untouched.
 */

const pageVariants = {
  initial: {
    opacity: 0,
    filter: 'blur(8px)',
    y: 15,
  },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
  },
  exit: {
    opacity: 0,
    filter: 'blur(8px)',
    y: -15,
  },
};

const pageTransition = {
  duration: 0.3,
  ease: 'easeInOut',
};

const reducedMotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const reducedMotionTransition = {
  duration: 0.15,
  ease: 'easeInOut',
};

const PageTransition = ({ children }) => {
  // Check for prefers-reduced-motion
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      variants={prefersReduced ? reducedMotionVariants : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={prefersReduced ? reducedMotionTransition : pageTransition}
      style={{
        // Prevent layout shifts: take full width, no overflow issues
        width: '100%',
        willChange: 'opacity, transform, filter',
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
