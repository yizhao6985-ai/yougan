import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClapperboardIcon,
  ImageIcon,
  MicIcon,
  PenLineIcon,
  SparklesIcon,
} from "lucide-react";

import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

type PreviewScenario = {
  workTitle: string;
  tag: string;
  icon: typeof PenLineIcon;
  previewTitle: string;
  previewLines: readonly string[];
  imageGradient: string | null;
};

const SCENARIOS: PreviewScenario[] = [
  {
    workTitle: "城市漫步随笔",
    tag: "观点长文",
    icon: PenLineIcon,
    previewTitle: "雨后街角的慢镜头",
    previewLines: [
      "石板路还留着昨夜的湿意，咖啡馆的暖光从磨砂玻璃里渗出来……",
      "我刻意放慢脚步，让城市在耳边重新对焦。",
    ],
    imageGradient:
      "from-sky-200/70 via-accent/40 to-emerald-100/50 dark:from-sky-900/40 dark:via-accent/30 dark:to-emerald-950/30",
  },
  {
    workTitle: "品牌 IP 插画",
    tag: "插画绘画",
    icon: ImageIcon,
    previewTitle: "春日吉祥物设定",
    previewLines: [
      "圆润轮廓 + 薄荷绿主色，适合笔记封面与贴纸延展。",
    ],
    imageGradient:
      "from-emerald-200/80 via-teal-100/60 to-amber-100/50 dark:from-emerald-900/50 dark:via-teal-950/40 dark:to-amber-950/30",
  },
  {
    workTitle: "产品测评口播",
    tag: "短视频脚本",
    icon: ClapperboardIcon,
    previewTitle: "30 秒开箱脚本",
    previewLines: [
      "【开场 3s】举机亮相：「这台真的值得等吗？」",
      "【主体 20s】三个亮点：续航 / 屏幕 / 价格",
      "【结尾 7s】引导评论：「你会选哪个颜色？」",
    ],
    imageGradient: null,
  },
  {
    workTitle: "播客提纲",
    tag: "脚本口播",
    icon: MicIcon,
    previewTitle: "独立创作者访谈",
    previewLines: [
      "Part 1 · 如何找到第一批读者",
      "Part 2 · 从写作到多平台分发",
    ],
    imageGradient: null,
  },
] as const;

const ROTATE_MS = 4500;
const MAX_PREVIEW_LINES = 3;

export function HomeStudioPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const rotateTimerRef = useRef<number | null>(null);
  const scenario = SCENARIOS[activeIndex]!;

  const startAutoRotate = useCallback(() => {
    if (rotateTimerRef.current !== null) {
      window.clearInterval(rotateTimerRef.current);
    }
    rotateTimerRef.current = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SCENARIOS.length);
    }, ROTATE_MS);
  }, []);

  const selectScenario = useCallback(
    (index: number) => {
      setActiveIndex(index);
      startAutoRotate();
    },
    [startAutoRotate],
  );

  useEffect(() => {
    startAutoRotate();
    return () => {
      if (rotateTimerRef.current !== null) {
        window.clearInterval(rotateTimerRef.current);
      }
    };
  }, [startAutoRotate]);

  const workItems = SCENARIOS.map((item) => item.workTitle);

  return (
    <div
      aria-label="创作台预览演示"
      className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none"
    >
      <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-amber-200/20 blur-2xl dark:from-primary/10 dark:to-amber-900/15" />

      <div
        className={cn(
          scene.surface,
          "relative overflow-hidden shadow-xl shadow-black/8 dark:shadow-black/35",
        )}
      >
        <div className="flex items-center gap-2 border-b border-border/70 bg-secondary/40 px-4 py-3">
          <span className="size-2.5 rounded-full bg-rose-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-xs font-medium text-muted-foreground">
            有感 · 创作台
          </span>
          <span className="ml-auto inline-flex min-w-[4.5rem] items-center justify-end gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-primary">
            <SparklesIcon className="size-3 shrink-0" />
            {scenario.tag}
          </span>
        </div>

        <div className="grid h-[19rem] grid-cols-[5.5rem_minmax(0,1fr)] sm:grid-cols-[6.5rem_minmax(0,1fr)]">
          <aside className="border-r border-border/60 bg-secondary/25 p-2.5">
            <p className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              作品
            </p>
            <ul className="mt-2 space-y-1" role="listbox" aria-label="作品列表">
              {workItems.map((item, index) => (
                <li key={item}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onClick={() => selectScenario(index)}
                    className={cn(
                      "w-full truncate rounded-md px-2 py-1.5 text-left text-[11px] transition-colors duration-300",
                      "cursor-pointer hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      index === activeIndex
                        ? "bg-accent font-medium text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="flex min-w-0 flex-col bg-gradient-to-b from-accent/15 to-background p-3 sm:p-4">
            <div className="relative min-h-0 flex-1">
              {SCENARIOS.map((item, index) => {
                const ScenarioIcon = item.icon;

                return (
                  <div
                    key={item.workTitle}
                    className={cn(
                      "absolute inset-0 flex flex-col transition-opacity duration-500",
                      index === activeIndex
                        ? "opacity-100"
                        : "pointer-events-none opacity-0",
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-primary">
                      <ScenarioIcon className="size-3 shrink-0" aria-hidden />
                      作品内容
                    </div>

                    <p className="mt-2 line-clamp-1 text-sm font-semibold leading-5 text-foreground">
                      {item.previewTitle}
                    </p>

                    <div className="mt-2 h-[3.9375rem] space-y-1.5 overflow-hidden">
                      {Array.from({ length: MAX_PREVIEW_LINES }, (_, lineIndex) => {
                        const line = item.previewLines[lineIndex];
                        return (
                          <p
                            key={lineIndex}
                            className={cn(
                              "truncate text-[11px] leading-5 text-muted-foreground",
                              !line && "invisible",
                            )}
                          >
                            {line ?? "\u00a0"}
                          </p>
                        );
                      })}
                    </div>

                    <div
                      className={cn(
                        "mt-3 h-[4.5rem] shrink-0 rounded-md ring-1 ring-border/40",
                        item.imageGradient
                          ? cn("bg-gradient-to-br", item.imageGradient)
                          : "bg-secondary/30",
                      )}
                    >
                      {!item.imageGradient ? (
                        <div className="flex h-full flex-col justify-center gap-1.5 px-3">
                          <span className="h-1 w-full rounded-full bg-primary/15" />
                          <span className="h-1 w-4/5 rounded-full bg-primary/10" />
                          <span className="h-1 w-3/5 rounded-full bg-primary/10" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="mt-auto flex shrink-0 justify-center gap-1.5 pt-4"
              role="tablist"
              aria-label="预览切换"
            >
              {SCENARIOS.map((item, index) => (
                <button
                  key={item.workTitle}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  aria-label={item.workTitle}
                  onClick={() => selectScenario(index)}
                  className={cn(
                    "size-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    index === activeIndex
                      ? "w-4 bg-primary"
                      : "cursor-pointer bg-border hover:bg-primary/40",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
