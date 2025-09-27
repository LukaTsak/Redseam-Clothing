import { Observable } from "rxjs";

export interface CartItem {
  id: number;
  product_id?: number;
  quantity: number;
  color: string;
  size: string;
  total_price: number;
  available_colors?: string[];
  imgIndex?: number;
  cover_image?: string;
  [key: string]: any;
}

export interface CartServiceHelpers {
  cartData: CartItem[];
  subtotalPrice: number;
  pendingQuantityChanges: Record<number, number>;
  updateProductInCart: (obj: any, id: number) => Observable<any>;
  deleteProductInCartAPI: (id: number, toBeDeleted: any) => Observable<any>;
  apiService: any;
  showMessage: (msg: string) => void;
  loadCart: () => void;
}

export function cartOpen(helper: CartServiceHelpers) {
  helper.apiService.shoppingCartActive = !helper.apiService.shoppingCartActive;
}

export function addToCart(
  helper: CartServiceHelpers,
  productData: any,
  selectedQuantity: number,
  selectedColor: string,
  selectedSize: string,
  productId: number
) {
  if (!localStorage.getItem('token')) {
    return helper.showMessage('Please register first');
  }

  if (!productData.quantity || !productData.available_colors || !productData.available_sizes) {
    return helper.showMessage('Can not add this item to cart');
  }

  const goingToCart = {
    quantity: selectedQuantity,
    color: selectedColor,
    size: selectedSize,
  };

  const imgIndex = productData.available_colors.indexOf(selectedColor);

  const productWithExtras = {
    ...productData,
    quantity: selectedQuantity,
    color: selectedColor,
    size: selectedSize,
    imgIndex: imgIndex,
    cover_image: productData.images[imgIndex],
  };

  helper.apiService.shoppingCartActive = true;
  helper.cartData.push(productWithExtras);

  helper.apiService.addToCart(goingToCart, productId).subscribe(() => {
    helper.loadCart();
  });
}

export function optimisticChangeQuantity(
  helper: CartServiceHelpers,
  index: number,
  operation: number,
  productId: number
) {
  const currentQuantity = helper.cartData[index].quantity;
  let newQuantity = currentQuantity;

  if (operation === 0 && currentQuantity > 1) {
    newQuantity--;
    helper.subtotalPrice -= helper.cartData[index].total_price;
  } else if (operation === 1) {
    newQuantity++;
    helper.subtotalPrice += helper.cartData[index].total_price;
  }

  helper.cartData[index].quantity = newQuantity;
  helper.pendingQuantityChanges[productId] = newQuantity;

  const updateGoingToCart = {
    quantity: newQuantity,
    color: helper.cartData[index].color,
    size: helper.cartData[index].size,
  };

  helper.updateProductInCart(updateGoingToCart, productId).subscribe({
    next: () => {
      delete helper.pendingQuantityChanges[productId];
    },
    error: () => {
      helper.cartData[index].quantity = currentQuantity;
      helper.pendingQuantityChanges[productId] = currentQuantity;
      helper.subtotalPrice -= (newQuantity - currentQuantity) * helper.cartData[index].total_price;
    },
  });
}

export function optimisticDeleteFromCart(
  helper: CartServiceHelpers,
  id: number,
  color: string,
  size: string
) {
  const itemIndex = helper.cartData.findIndex(
    (item) => item.id === id && item.color === color && item.size === size
  );

  if (itemIndex === -1) return;

  const removedItem = helper.cartData.splice(itemIndex, 1)[0];
  helper.subtotalPrice -= removedItem.total_price;

  const toBeDeleted = { color, size };

  helper.deleteProductInCartAPI(id, toBeDeleted).subscribe({
    next: () => {
      console.log('Delete confirmed');
    },
    error: () => {
      console.error('Delete failed');
      helper.cartData.splice(itemIndex, 0, removedItem);
      helper.subtotalPrice += removedItem.total_price;
    },
  });
}

export function loadCart(helper: CartServiceHelpers) {
  helper.apiService.getCart().subscribe((res: any) => {
    helper.cartData = res.data || res;

    helper.cartData.forEach((item: any) => {
      item.imgIndex = item.available_colors.indexOf(item.color);
    });

    helper.subtotalPrice = helper.cartData.reduce(
      (total, item) => total + item.total_price,
      0
    );
  });
}

export function findIndex(helper: CartServiceHelpers, id: any) {
  return helper.cartData.findIndex(
    (item: CartItem) => item.product_id === id
  );
}
