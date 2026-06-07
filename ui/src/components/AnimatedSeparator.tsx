import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/Separator';

export type AnimatedSeparatorProps = {
  visible: boolean;
};

export function AnimatedSeparator(props: AnimatedSeparatorProps) {
  const { visible } = props;

  return (
    <div className="h-px">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Separator />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
