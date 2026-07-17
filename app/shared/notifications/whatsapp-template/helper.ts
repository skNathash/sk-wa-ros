import type { PaginationState } from "~/types/CommonTypes";
import WhatsappTemplateService from "~/services/WhatsappTemplateService";

export const getData = async (
  params: Record<string, any>,
  dynamicData: Record<string, any> = {},
) => {
  try {
    const resp = await WhatsappTemplateService.getList(params);
    const list = resp?.data?.data || [];

    // Format each template to add isAssetFeatureImage
    const formattedList = Array.isArray(list)
      ? list.map((t: any) => WhatsappTemplateService.formatTemplate(t))
      : list;

    // If templates have a `body` key and dynamicData is provided,
    // render the body using the service helper so placeholders are replaced.
    if (dynamicData && Object.keys(dynamicData).length) {
      return Array.isArray(formattedList)
        ? formattedList.map((t: any) => {
            if (t && typeof t.body === "string") {
              return {
                ...t,
                renderedBody: WhatsappTemplateService.renderTemplate(
                  t.body,
                  dynamicData,
                ),
              };
            }
            return t;
          })
        : formattedList;
    }

    return formattedList;
  } catch (error) {
    console.error("WhatsappTemplateHelper.getData", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const p = { ...params };
    delete p.page;
    delete p.count;
    const resp = await WhatsappTemplateService.getList({
      ...p,
      outputType: "count",
    });
    return resp?.data?.data?.count || 0;
  } catch (error) {
    console.error("WhatsappTemplateHelper.getCount", error);
    return 0;
  }
};

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
) => {
  const p: Record<string, any> = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    filter: {
      status: "Active",
    },
    sort: { name: 1 },
  };

  if (filters?.search?.trim()) {
    p.filter.search = filters.search.trim();
  }

  if (filters?.language && filters.language !== "all") {
    p.filter.language = filters.language;
  }

  if (filters?.categories?.length) {
    // Ignore any category value equal to 'all' (case-insensitive)
    const cats = (filters.categories || []).filter((c: any) =>
      c ? String(c).toLowerCase() !== "all" : false,
    );

    if (cats.length) {
      p.filter.category = { $in: cats };
    }
  }

  // Always ignore the 'Internal' category by default. If other ignore
  // categories are provided, merge them with 'Internal' (deduplicated).
  const effectiveIgnore = Array.isArray(filters?.ignoreCategories)
    ? Array.from(new Set([...(filters.ignoreCategories || []), "Internal"]))
    : ["Internal"];

  if (effectiveIgnore.length) {
    // If category filter already exists as $in, convert to $and with $nin
    if (p.filter.category) {
      p.filter = {
        ...p.filter,
        $and: [
          { category: p.filter.category },
          { category: { $nin: effectiveIgnore } },
        ],
      };
      delete p.filter.category;
    } else {
      p.filter.category = { $nin: effectiveIgnore };
    }
  }

  if (filters?.templateFor?.length) {
    p.filter.templateFor = { $in: filters.templateFor };
  }

  if (filters?.showAll) {
    p.showGenericTemplates = true;
  } else {
    p.showRecommendedTemplates = true;
  }

  if (!Object.keys(p.filter).length) delete p.filter;

  return p;
};

export const getCategories = async (
  filters: Record<string, any> = {},
): Promise<Array<{ label: string; value: string }>> => {
  try {
    const p: Record<string, any> = {
      filter: {
        status: "Active",
      },
      outputType: "groupby",
      groupByField: "category",
    };

    if (filters.language && filters.language !== "all") {
      p.filter.language = filters.language;
    }

    if (filters.templateFor?.length) {
      p.filter.templateFor = { $in: filters.templateFor };
    }

    // If ignoreCategories provided, exclude them using $nin
    const effectiveIgnore = Array.isArray(filters.ignoreCategories)
      ? Array.from(new Set([...(filters.ignoreCategories || []), "Internal"]))
      : ["Internal"];

    if (effectiveIgnore.length) {
      p.filter.category = { $nin: effectiveIgnore };
    }

    const resp = await WhatsappTemplateService.getList(p);
    const data = resp?.data?.data || [];

    // Expecting grouped response like [{ _id: 'CategoryName', count: 12 }, ...]
    if (Array.isArray(data) && data.length) {
      const t = data.map((g: any) => {
        const val = g.category || "";
        return { label: val, value: val };
      });

      t.unshift({ label: "All", value: "all" });

      return t;
    }

    return [];
  } catch (error) {
    console.error("WhatsappTemplateHelper.getCategories", error);
    return [];
  }
};

export default { getData, getCount, prepareParams };
